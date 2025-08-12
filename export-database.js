
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import { format } from 'date-fns';

// Configure WebSocket for Neon in Node.js environment
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

async function exportDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 1 // Use single connection for export
  });
  
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  const filename = `database-export-${timestamp}.sql`;

  try {
    console.log('🔄 Starting database export...');
    console.log('📡 Connection:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));
    
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log(`📋 Found ${tablesResult.rows.length} tables to export`);
    
    let sqlDump = `-- Nearby Traveler Database Export\n`;
    sqlDump += `-- Date: ${new Date().toISOString()}\n`;
    sqlDump += `-- Tables: ${tablesResult.rows.length}\n\n`;

    const exportData = {};

    for (const table of tablesResult.rows) {
      const tableName = table.tablename;
      console.log(`📋 Exporting table: ${tableName}`);

      // Get table structure
      const structureResult = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);

      // Get constraints and indexes
      const constraintsResult = await pool.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = $1 AND table_schema = 'public'
      `, [tableName]);

      sqlDump += `-- Table: ${tableName}\n`;
      sqlDump += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
      sqlDump += `CREATE TABLE "${tableName}" (\n`;
      
      const columns = structureResult.rows.map(col => {
        let def = `  "${col.column_name}" ${col.data_type}`;
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        }
        if (col.is_nullable === 'NO') def += ' NOT NULL';
        if (col.column_default && !col.column_default.includes('nextval')) {
          def += ` DEFAULT ${col.column_default}`;
        }
        return def;
      });
      
      sqlDump += columns.join(',\n') + '\n);\n\n';

      // Get data
      const dataResult = await pool.query(`SELECT * FROM "${tableName}"`);
      
      if (dataResult.rows.length > 0) {
        const columnNames = structureResult.rows.map(col => col.column_name);
        sqlDump += `-- Data for ${tableName} (${dataResult.rows.length} rows)\n`;
        
        for (const row of dataResult.rows) {
          const values = columnNames.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'boolean') return val ? 'true' : 'false';
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          });
          
          sqlDump += `INSERT INTO "${tableName}" ("${columnNames.join('", "')}") VALUES (${values.join(', ')});\n`;
        }
        sqlDump += '\n';
      } else {
        sqlDump += `-- No data in ${tableName}\n\n`;
      }

      // Store for JSON export
      exportData[tableName] = {
        structure: structureResult.rows,
        data: dataResult.rows,
        rowCount: dataResult.rows.length
      };
    }

    // Write SQL file
    fs.writeFileSync(filename, sqlDump);
    console.log(`✅ SQL export created: ${filename}`);
    console.log(`📊 File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);

    // Create JSON export
    const jsonFilename = `database-export-${timestamp}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(exportData, null, 2));
    console.log(`✅ JSON export created: ${jsonFilename}`);

    // Create summary report
    const summaryFilename = `database-summary-${timestamp}.txt`;
    let summary = `NEARBY TRAVELER DATABASE EXPORT SUMMARY\n`;
    summary += `=========================================\n\n`;
    summary += `Export Date: ${new Date().toISOString()}\n`;
    summary += `Database: Neon PostgreSQL\n`;
    summary += `Total Tables: ${tablesResult.rows.length}\n\n`;
    
    summary += `TABLE BREAKDOWN:\n`;
    for (const [tableName, info] of Object.entries(exportData)) {
      summary += `- ${tableName}: ${info.rowCount} rows, ${info.structure.length} columns\n`;
    }
    
    summary += `\nFILES CREATED:\n`;
    summary += `- ${filename} (SQL dump)\n`;
    summary += `- ${jsonFilename} (JSON data)\n`;
    summary += `- ${summaryFilename} (this summary)\n`;

    fs.writeFileSync(summaryFilename, summary);
    console.log(`✅ Summary created: ${summaryFilename}`);

    console.log('\n🎉 Database export completed successfully!');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

exportDatabase();
