
import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import { format } from 'date-fns';

async function exportDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  const filename = `database-export-${timestamp}.sql`;

  try {
    console.log('🔄 Starting database export...');
    
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    let sqlDump = `-- Database Export ${new Date().toISOString()}\n`;
    sqlDump += `-- Connection: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@')}\n\n`;

    for (const table of tablesResult.rows) {
      const tableName = table.tablename;
      console.log(`📋 Exporting table: ${tableName}`);

      // Get table structure
      const structureResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);

      sqlDump += `-- Table: ${tableName}\n`;
      sqlDump += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      
      const columns = structureResult.rows.map(col => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.is_nullable === 'NO') def += ' NOT NULL';
        if (col.column_default) def += ` DEFAULT ${col.column_default}`;
        return def;
      });
      
      sqlDump += columns.join(',\n') + '\n);\n\n';

      // Get data
      const dataResult = await pool.query(`SELECT * FROM ${tableName}`);
      
      if (dataResult.rows.length > 0) {
        const columnNames = structureResult.rows.map(col => col.column_name);
        sqlDump += `-- Data for ${tableName}\n`;
        
        for (const row of dataResult.rows) {
          const values = columnNames.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return val;
          });
          
          sqlDump += `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        sqlDump += '\n';
      }
    }

    // Write to file
    fs.writeFileSync(filename, sqlDump);
    console.log(`✅ Database exported to: ${filename}`);
    console.log(`📊 File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);

    // Create JSON export as well
    const jsonData = {};
    for (const table of tablesResult.rows) {
      const tableName = table.tablename;
      const dataResult = await pool.query(`SELECT * FROM ${tableName}`);
      jsonData[tableName] = dataResult.rows;
    }
    
    const jsonFilename = `database-export-${timestamp}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(jsonData, null, 2));
    console.log(`✅ JSON export created: ${jsonFilename}`);

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await pool.end();
  }
}

exportDatabase();
