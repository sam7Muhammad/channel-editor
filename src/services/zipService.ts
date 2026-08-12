import JSZip from 'jszip';
import { MetadataInfo } from '../types/channel';

export interface ExtractedPackage {
  filename: string;
  dvbs: Uint8Array;
  sat?: Uint8Array;
  ipsrv?: Uint8Array;
  metadata?: MetadataInfo;
  otherFiles: Map<string, Uint8Array>;
}

export class SamsungZipService {
  /**
   * Unpack a Samsung channel list zip file
   */
  static async extractZip(file: File | Blob, filename: string): Promise<ExtractedPackage> {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);

    const dvbsFile = loadedZip.file('dvbs');
    if (!dvbsFile) {
      throw new Error('Invalid Samsung channel list archive: Missing "dvbs" database.');
    }

    const dvbsBuffer = await dvbsFile.async('uint8array');

    const satFile = loadedZip.file('sat');
    const satBuffer = satFile ? await satFile.async('uint8array') : undefined;

    const ipsrvFile = loadedZip.file('ipsrv');
    const ipsrvBuffer = ipsrvFile ? await ipsrvFile.async('uint8array') : undefined;

    let metadata: MetadataInfo | undefined = undefined;
    const metadataFile = loadedZip.file('metadata.xml');
    if (metadataFile) {
      const xmlText = await metadataFile.async('text');
      metadata = this.parseMetadataXml(xmlText);
    }

    // Preserve any other supplementary files inside the zip
    const otherFiles = new Map<string, Uint8Array>();
    for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
      if (!zipEntry.dir && !['dvbs', 'sat', 'ipsrv', 'metadata.xml'].includes(relativePath)) {
        const buf = await zipEntry.async('uint8array');
        otherFiles.set(relativePath, buf);
      }
    }

    return {
      filename,
      dvbs: dvbsBuffer,
      sat: satBuffer,
      ipsrv: ipsrvBuffer,
      metadata,
      otherFiles,
    };
  }

  /**
   * Repack modified databases and metadata into a valid Samsung ZIP archive
   */
  static async createExportZip(
    dvbs: Uint8Array,
    sat?: Uint8Array,
    ipsrv?: Uint8Array,
    metadataXml?: string,
    otherFiles?: Map<string, Uint8Array>
  ): Promise<Blob> {
    const zip = new JSZip();

    // Add main databases (uncompressed or standard deflate to match TV expectation)
    zip.file('dvbs', dvbs, { binary: true });

    if (sat) {
      zip.file('sat', sat, { binary: true });
    }

    if (ipsrv) {
      zip.file('ipsrv', ipsrv, { binary: true });
    }

    if (metadataXml) {
      zip.file('metadata.xml', metadataXml);
    }

    if (otherFiles) {
      otherFiles.forEach((data, path) => {
        zip.file(path, data, { binary: true });
      });
    }

    return await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  }

  /**
   * Parse metadata.xml to extract TV configuration values
   */
  private static parseMetadataXml(xmlText: string): MetadataInfo {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    const analog = xmlDoc.querySelector('ANALOG_COUNTRY')?.textContent || undefined;
    const digital = xmlDoc.querySelector('DIGITAL_COUNTRY')?.textContent || undefined;
    const sei = xmlDoc.querySelector('SEI_VERSION')?.textContent || undefined;

    return {
      analogCountry: analog,
      digitalCountry: digital,
      seiVersion: sei,
      rawXml: xmlText,
    };
  }
}
