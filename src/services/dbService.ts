import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { Channel, Satellite, ServiceType } from '../types/channel';
import { decodeSamsungString, encodeSamsungString, calculateSignalScore } from '../utils/samsungEncoder';

let SQLInstance: SqlJsStatic | null = null;

async function loadWasmBinary(): Promise<ArrayBuffer> {
  const possibleUrls = [
    '/sql-wasm.wasm',
    '/assets/sql-wasm.wasm',
    './sql-wasm.wasm',
    'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm',
  ];

  for (const url of possibleUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const header = new Uint8Array(buffer, 0, 4);
        // Verify WASM magic word 0x00 0x61 0x73 0x6d (\0asm)
        if (
          header[0] === 0x00 &&
          header[1] === 0x61 &&
          header[2] === 0x73 &&
          header[3] === 0x6d
        ) {
          console.log(`[SQL.js] Loaded WebAssembly binary successfully from: ${url}`);
          return buffer;
        }
      }
    } catch (e) {
      // try next
    }
  }

  throw new Error('Could not load valid sql-wasm.wasm binary from any URL.');
}

export async function getSqlInstance(): Promise<SqlJsStatic> {
  if (!SQLInstance) {
    const wasmBinary = await loadWasmBinary();
    SQLInstance = await initSqlJs({
      wasmBinary,
    });
  }
  return SQLInstance;
}

export class SamsungDbManager {
  private dvbsDb: Database | null = null;
  private satDb: Database | null = null;
  private ipsrvDb: Database | null = null;

  private dvbsUserVersion: number = 0;

  async loadDatabases(files: {
    dvbs: Uint8Array;
    sat?: Uint8Array;
    ipsrv?: Uint8Array;
  }) {
    const SQL = await getSqlInstance();

    this.dvbsDb = new SQL.Database(files.dvbs);
    const uvRes = this.dvbsDb.exec('PRAGMA user_version');
    if (uvRes.length > 0 && uvRes[0].values.length > 0) {
      this.dvbsUserVersion = Number(uvRes[0].values[0][0]);
    }

    if (files.sat) {
      this.satDb = new SQL.Database(files.sat);
    }

    if (files.ipsrv) {
      this.ipsrvDb = new SQL.Database(files.ipsrv);
    }
  }

  getSatellites(): Satellite[] {
    if (!this.satDb) return [];
    try {
      const res = this.satDb.exec('SELECT satId, satName, satDir, satPos FROM SAT');
      if (res.length === 0) return [];
      
      return res[0].values.map((row) => ({
        satId: Number(row[0]),
        satName: decodeSamsungString(row[1] as string) || (row[1] as string) || `Sat ${row[0]}`,
        satDir: row[2] != null ? Number(row[2]) : undefined,
        satPos: row[3] != null ? Number(row[3]) : undefined,
      }));
    } catch (e) {
      console.warn('Error reading satellites:', e);
      return [];
    }
  }

  getChannels(satellites: Satellite[] = []): Channel[] {
    if (!this.dvbsDb) return [];

    const satMap = new Map<number, string>();
    satellites.forEach((s) => satMap.set(s.satId, s.satName));

    const favsBySrvId = new Map<string, number[]>();
    try {
      const favRes = this.dvbsDb.exec(
        'SELECT CAST(srvId AS TEXT) as srvIdStr, fav, pos FROM SRV_FAV ORDER BY fav, pos'
      );
      if (favRes.length > 0) {
        for (const row of favRes[0].values) {
          const srvId = String(row[0]);
          const fav = Number(row[1]);
          if (!favsBySrvId.has(srvId)) {
            favsBySrvId.set(srvId, []);
          }
          const list = favsBySrvId.get(srvId)!;
          if (!list.includes(fav)) {
            list.push(fav);
          }
        }
      }
    } catch (e) {
      console.warn('Error loading favorites:', e);
    }

    const query = `
      SELECT 
        CAST(s.srvId AS TEXT) as srvIdStr,
        CAST(s.chId AS TEXT) as chIdStr,
        s.major,
        s.minor,
        s.srvName,
        s.srvType,
        s.lockMode,
        s.hidden,
        s.scrambled,
        c.freq,
        c.pol,
        c.sr,
        c.mod,
        c.chType,
        COALESCE(sg.sigStr, 0) as sigStr,
        COALESCE(sg.sigQa, 0) as sigQa,
        COALESCE(sg.bitErr, 0) as bitErr,
        sd.lcn,
        p.provName
      FROM SRV s
      JOIN CHNL c ON s.chId = c.chId
      LEFT JOIN SGNL sg ON c.chId = sg.chId
      LEFT JOIN SRV_DVB sd ON s.srvId = sd.srvId
      LEFT JOIN PROV p ON sd.provId = p.provId
      ORDER BY s.major ASC, s.srvId ASC;
    `;

    const res = this.dvbsDb.exec(query);
    if (res.length === 0) return [];

    const channels: Channel[] = [];
    const rows = res[0].values;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const srvId = String(row[0]);
      const chId = String(row[1]);
      const major = Number(row[2]);
      const minor = Number(row[3]);
      const rawName = (row[4] as string) || '';
      const decodedName = decodeSamsungString(rawName) || `Channel ${major}`;
      const srvType = Number(row[5]);
      const lockMode = Boolean(row[6]);
      const hidden = Boolean(row[7]);
      const scrambled = Boolean(row[8]);
      const freq = Number(row[9] || 0);
      const pol = row[10] != null ? Number(row[10]) : undefined;
      const sr = row[11] != null ? Number(row[11]) : undefined;
      const mod = row[12] != null ? Number(row[12]) : undefined;
      const sigStr = Number(row[14] || 0);
      const sigQa = Number(row[15] || 0);
      const bitErr = Number(row[16] || 0);
      const lcn = row[17] != null ? Number(row[17]) : undefined;
      const provRaw = row[18] as string | undefined;
      const provName = provRaw ? decodeSamsungString(provRaw) : undefined;

      let typeLabel: ServiceType = 'SD TV';
      if (srvType === 25) typeLabel = 'HD TV';
      else if (srvType === 1) typeLabel = 'SD TV';
      else if (srvType === 2) typeLabel = 'Radio';
      else if (srvType === 12) typeLabel = 'Data';
      else typeLabel = 'Other';

      const lowerName = decodedName.toLowerCase().trim();
      const isJunk =
        lowerName.startsWith('test') ||
        lowerName === 'spare' ||
        lowerName === 'feed' ||
        lowerName === 'data' ||
        lowerName === '.' ||
        lowerName === '-' ||
        lowerName === 'service' ||
        srvType === 12;

      const favs = favsBySrvId.get(srvId) || [];
      const signalScore = calculateSignalScore(sigQa, bitErr, sigStr);

      channels.push({
        srvId,
        chId,
        major,
        minor,
        srvName: decodedName,
        rawName,
        srvType,
        typeLabel,
        freq,
        pol,
        sr,
        mod,
        lockMode,
        hidden,
        scrambled,
        sigStr,
        sigQa,
        bitErr,
        signalScore,
        lcn,
        provName,
        favs,
        isJunk,
      });
    }

    const nameGroups = new Map<string, Channel[]>();
    channels.forEach((ch) => {
      const cleanKey = ch.srvName.trim().toLowerCase();
      if (cleanKey && !ch.isJunk) {
        if (!nameGroups.has(cleanKey)) {
          nameGroups.set(cleanKey, []);
        }
        nameGroups.get(cleanKey)!.push(ch);
      }
    });

    nameGroups.forEach((group, key) => {
      if (group.length > 1) {
        group.forEach((ch) => {
          ch.isDuplicate = true;
          ch.duplicateGroupId = key;
        });
      }
    });

    return channels;
  }

  saveChannels(channels: Channel[], favoriteLists?: Map<number, string[]>) {
    if (!this.dvbsDb) throw new Error('Database not loaded');

    this.dvbsDb.run('BEGIN TRANSACTION;');

    try {
      const updateStmt = this.dvbsDb.prepare(`
        UPDATE SRV 
        SET major = ?, srvName = ?, lockMode = ?, hidden = ?, modifiedByUser = 1
        WHERE srvId = ?;
      `);

      for (let i = 0; i < channels.length; i++) {
        const ch = channels[i];
        const newMajor = ch.major;
        const reencodedName = encodeSamsungString(ch.srvName);
        const lockVal = ch.lockMode ? 1 : 0;
        const hiddenVal = ch.hidden ? 1 : 0;

        updateStmt.run([newMajor, reencodedName, lockVal, hiddenVal, ch.srvId]);
      }
      updateStmt.free();

      if (favoriteLists) {
        this.dvbsDb.run('DELETE FROM SRV_FAV;');
        const favStmt = this.dvbsDb.prepare(
          'INSERT INTO SRV_FAV (srvId, fav, pos, recState) VALUES (?, ?, ?, 0);'
        );

        favoriteLists.forEach((srvIds, favNumber) => {
          srvIds.forEach((srvId, index) => {
            favStmt.run([srvId, favNumber, index]);
          });
        });
        favStmt.free();
      }

      if (this.dvbsUserVersion) {
        this.dvbsDb.run(`PRAGMA user_version = ${this.dvbsUserVersion};`);
      }

      this.dvbsDb.run('COMMIT;');
    } catch (err) {
      this.dvbsDb.run('ROLLBACK;');
      throw err;
    }
  }

  exportDatabases(): {
    dvbs: Uint8Array;
    sat?: Uint8Array;
    ipsrv?: Uint8Array;
  } {
    if (!this.dvbsDb) throw new Error('DVBS database not initialized');

    const dvbsBinary = this.dvbsDb.export();
    const satBinary = this.satDb ? this.satDb.export() : undefined;
    const ipsrvBinary = this.ipsrvDb ? this.ipsrvDb.export() : undefined;

    return {
      dvbs: dvbsBinary,
      sat: satBinary,
      ipsrv: ipsrvBinary,
    };
  }

  close() {
    if (this.dvbsDb) {
      this.dvbsDb.close();
      this.dvbsDb = null;
    }
    if (this.satDb) {
      this.satDb.close();
      this.satDb = null;
    }
    if (this.ipsrvDb) {
      this.ipsrvDb.close();
      this.ipsrvDb = null;
    }
  }
}
