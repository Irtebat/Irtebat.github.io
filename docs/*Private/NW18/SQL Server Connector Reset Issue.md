
**Notes** : 23/1/26

A SQL Server CDC connector’s offsets point to **specific LSNs in the database’s transaction log / CDC mapping tables**. When you do:

- ``

you are effectively **replacing the entire database state** (data + log) with what is inside the backup. 

This is aligned with the general CDC/restore guidance that CDC depends on the log + capture metadata, and restores change what is available. 
It is a common symptom in offset-mismatch scenarios: the task is up, but it cannot advance because the stored position is no longer reachable. 


CDC will effectively capture changes that occur **from the restored database’s current log position forward**. From the connector’s perspective, this is a “new reality”: offsets from the pre-restore world do not apply.

Summary:

 Restore changes the **database incarnation** and resets the **transaction log context**. CDC depends on LSNs being monotonic and continuous.

After a restore:

- The database has a new log timeline
- Pre-restore LSNs are invalid
- CDC must start tracking from the new log chain
- **Only subsequent writes after restore** should generate CDC events

This is therefore a **log continuity** problem.

### Proposed Solution

I have shared a postman collection with appropriate labels ( mentioned in the steps below )

Step 1: Pause the CDC connector  
Pause the SQL Server CDC connector (or stop the Connect task) so it does not retry using stale offsets.
- List connectors : Use step_1.1-list_connectors
- Check status of SQL Server connector : Use step_1.2-connector_status
- Pause SQL Server connector : Use step_1.3-pause_connector
- Wait for connector to pause. To confirm, use step_1.2-connector_status

Step 2: Restore the database as done today

- Note: If CDC configuration must be preserved, restore with `KEEP_CDC` (only if supported by the restore strategy). I suggest the team to refer to Microsoft documentation on CDC and restore behavior  [https://learn.microsoft.com/en-us/sql/relational-databases/track-changes/change-data-capture-and-other-sql-server-features?view=sql-server-ver17](https://learn.microsoft.com/en-us/sql/relational-databases/track-changes/change-data-capture-and-other-sql-server-features?view=sql-server-ver17&utm_source=chatgpt.com)
- If `KEEP_CDC` is not used, CDC may need to be re-enabled and jobs recreated — your Step 3 covers this.

Step 3: Verify CDC is usable post-restore

Run the following checks on the restored database:
- **Database-level CDC**
    `SELECT name, is_cdc_enabled FROM sys.databases WHERE name = 'FINWIZFINAL';`
- **Table-level CDC**
    `SELECT name, is_tracked_by_cdc FROM sys.tables WHERE name IN ('<table1>', '<table2>');`
- **CDC capture job (if using SQL Agent)**
    `EXEC sys.sp_cdc_help_jobs;`

If any of these checks fail, CDC must be re-enabled before proceeding.  
The `KEEP_CDC` flag in Step 2 should help avoid this.

Step 4: Reset connector offsets
This forces the connector to restart from the **post-restore CDC minimum LSN**. It starts from the minimum _valid_ LSN after restore
- Initiate offset delete : step_4.2-delete_offsets
- Confirm offsets are deleted : step_4.3-offsets_delete_status

Step 5: Resume or restart the connector
- Use step_5-resume_connector
- Wait for connector to start. To confirm, use step_1.2-connector_status
### Notes

- Duplicates around the restore boundary are expected
- Per discussion with the team, downstream dedup or upsert logic is already in place (primary key, natural key, or idempotent sink)    
- If no writes occur between **Step 1 and Step 5**, there is **no data loss**

Attached are postman collection to help with Connect related actions ( Pause Connector, Reset Offset, Confirm Offset reset, Resume Connector + misc  )