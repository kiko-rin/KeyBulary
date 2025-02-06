const sqlite3 = require('sqlite3').verbose();

class StarDict {
    constructor(filename, verbose = false) {
        this.dbname = filename;
        if (filename !== ':memory:') {
            this.dbname = require('path').resolve(filename);
        }
        this.conn = null;
        this.verbose = verbose;
        this.open();
    }

    open() {
        const sql = `
        CREATE TABLE IF NOT EXISTS "stardict" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
            "word" VARCHAR(64) COLLATE NOCASE NOT NULL UNIQUE,
            "sw" VARCHAR(64) COLLATE NOCASE NOT NULL,
            "phonetic" VARCHAR(64),
            "definition" TEXT,
            "translation" TEXT,
            "pos" VARCHAR(16),
            "collins" INTEGER DEFAULT(0),
            "oxford" INTEGER DEFAULT(0),
            "tag" VARCHAR(64),
            "bnc" INTEGER DEFAULT(NULL),
            "frq" INTEGER DEFAULT(NULL),
            "exchange" TEXT,
            "detail" TEXT,
            "audio" TEXT
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "stardict_1" ON stardict (id);
        CREATE UNIQUE INDEX IF NOT EXISTS "stardict_2" ON stardict (word);
        CREATE INDEX IF NOT EXISTS "stardict_3" ON stardict (sw, word collate nocase);
        CREATE INDEX IF NOT EXISTS "sd_1" ON stardict (word collate nocase);
        `;

        this.conn = new sqlite3.Database(this.dbname);

        this.conn.serialize(() => {
            this.conn.exec(sql);
        });
    }

    close() {
        if (this.conn) {
            this.conn.close();
        }
        this.conn = null;
    }

    out(text) {
        if (this.verbose) {
            console.log(text);
        }
        return true;
    }

    stripword(word) {
        return word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }

    query(key) {
        let sql;
        let params;
        if (typeof key === 'number') {
            sql = 'SELECT * FROM stardict WHERE id = ?;';
            params = [key];
        } else if (typeof key === 'string') {
            sql = 'SELECT * FROM stardict WHERE word = ?;';
            params = [key];
        } else {
            return Promise.reject(new Error('Invalid key type'));
        }

        return new Promise((resolve, reject) => {
            this.conn.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.record2obj(row));
                }
            });
        });
    }

    match(word, limit = 10, strip = false) {
        let sql;
        let params;
        if (!strip) {
            sql = 'SELECT id, word FROM stardict WHERE word >= ? ORDER BY word COLLATE NOCASE LIMIT ?;';
            params = [word, limit];
        } else {
            sql = 'SELECT id, word FROM stardict WHERE sw >= ? ORDER BY sw, word COLLATE NOCASE LIMIT ?;';
            params = [this.stripword(word), limit];
        }

        return new Promise((resolve, reject) => {
            this.conn.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => Object.values(row)));
                }
            });
        });
    }

    queryBatch(keys) {
        if (!keys || keys.length === 0) {
            return [];
        }

        const placeholders = keys.map(() => '?').join(', ');
        const sql = `SELECT * FROM stardict WHERE ${keys.map(key => typeof key === 'number' ? 'id = ?' : 'word = ?').join(' OR ')};`;

        return new Promise((resolve, reject) => {
            this.conn.all(sql, keys, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const results = {};
                    rows.forEach(row => {
                        const obj = this.record2obj(row);
                        results[obj.word.toLowerCase()] = obj;
                        results[obj.id] = obj;
                    });

                    resolve(keys.map(key => typeof key === 'number' ? results[key] : results[key.toLowerCase()]));
                }
            });
        });
    }

    count() {
        return new Promise((resolve, reject) => {
            this.conn.get('SELECT COUNT(*) AS count FROM stardict;', (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }

    register(word, items, commit = true) {
        return new Promise((resolve, reject) => {
            this.conn.run('INSERT INTO stardict(word, sw) VALUES(?, ?);', [word, this.stripword(word)], err => {
                if (err) {
                    this.out(err.message);
                    reject(false);
                } else {
                    this.update(word, items, commit).then(resolve).catch(reject);
                }
            });
        });
    }

    remove(key, commit = true) {
        let sql;
        let params;
        if (typeof key === 'number') {
            sql = 'DELETE FROM stardict WHERE id=?;';
            params = [key];
        } else {
            sql = 'DELETE FROM stardict WHERE word=?;';
            params = [key];
        }

        return new Promise((resolve, reject) => {
            this.conn.run(sql, params, err => {
                if (err) {
                    reject(false);
                } else {
                    if (commit) {
                        this.commit().then(resolve).catch(reject);
                    } else {
                        resolve(true);
                    }
                }
            });
        });
    }

    deleteAll(resetId = false) {
        const sql1 = 'DELETE FROM stardict;';
        const sql2 = "UPDATE sqlite_sequence SET seq = 0 WHERE name = 'stardict';";

        return new Promise((resolve, reject) => {
            this.conn.run(sql1, err => {
                if (err) {
                    this.out(err.message);
                    reject(false);
                } else {
                    if (resetId) {
                        this.conn.run(sql2, err => {
                            if (err) {
                                this.out(err.message);
                                reject(false);
                            } else {
                                this.commit().then(resolve).catch(reject);
                            }
                        });
                    } else {
                        this.commit().then(resolve).catch(reject);
                    }
                }
            });
        });
    }

    update(key, items, commit = true) {
        const names = [];
        const values = [];

        for (const [name, value] of Object.entries(items)) {
            names.push(name);
            if (name === 'detail') {
                if (value !== null) {
                    values.push(JSON.stringify(value));
                } else {
                    values.push(null);
                }
            } else {
                values.push(value);
            }
        }

        if (names.length === 0) {
            if (commit) {
                return this.commit();
            }
            return Promise.resolve(false);
        }

        const setClause = names.map(name => `${name}=?`).join(', ');
        let sql;
        let params;
        if (typeof key === 'string') {
            sql = `UPDATE stardict SET ${setClause} WHERE word=?;`;
            params = [...values, key];
        } else {
            sql = `UPDATE stardict SET ${setClause} WHERE id=?;`;
            params = [...values, key];
        }

        return new Promise((resolve, reject) => {
            this.conn.run(sql, params, err => {
                if (err) {
                    reject(false);
                } else {
                    if (commit) {
                        this.commit().then(resolve).catch(reject);
                    } else {
                        resolve(true);
                    }
                }
            });
        });
    }

    async *[Symbol.asyncIterator]() {
        const sql = 'SELECT "id", "word" FROM "stardict" ORDER BY "word" COLLATE NOCASE;';
        const stmt = await new Promise((resolve, reject) => {
            this.conn.prepare(sql, (err, statement) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(statement);
                }
            });
        });

        while (true) {
            const row = await new Promise((resolve, reject) => {
                stmt.get((err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });

            if (!row) {
                break;
            }

            yield row;
        }

        stmt.finalize();
    }

    length() {
        return this.count();
    }

    contains(key) {
        return this.query(key).then(result => result !== null);
    }

    getItem(key) {
        return this.query(key);
    }

    commit() {
        return new Promise((resolve, reject) => {
            this.conn.run('COMMIT;', err => {
                if (err) {
                    this.conn.run('ROLLBACK;');
                    reject(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    dumps() {
        return new Promise((resolve, reject) => {
            this.conn.all('SELECT "word" FROM "stardict";', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row.word));
                }
            });
        });
    }

    record2obj(record) {
        if (!record) {
            return null;
        }
        const word = {};
        for (const key in record) {
            if (record.hasOwnProperty(key)) {
                word[key] = record[key];
            }
        }
        if (word.detail) {
            try {
                word.detail = JSON.parse(word.detail);
            } catch (e) {
                word.detail = null;
            }
        }
        return word;
    }
}

module.exports = StarDict;



