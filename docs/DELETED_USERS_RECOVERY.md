# Recovering deleted students and teachers

## What the backend does on delete

School admins can remove a person via:

- `DELETE /core/students/<id>/`
- `DELETE /core/teachers/<id>/`

The implementation deletes the underlying **`User`** row (`student.user.delete()` / `teacher.user.delete()`). Because **`Student.user`** and **`Teacher.user`** are **`OneToOneField(..., on_delete=models.CASCADE)`**, deleting the user also removes the **`Student`** or **`Teacher`** profile and, by further cascade rules, related rows (for example **`StudentHomework`** tied to that student).

There is **no soft-delete flag**, **no “trash” table**, and **no API to undelete** a profile. Once the request succeeds (`204 No Content`), the data is gone from the live database.

## How you would “retrieve” deleted data

Recovery is an **operations / database** concern, not something exposed by the app:

1. **Restore from backup**  
   If you take regular SQLite/Postgres dumps or file snapshots, restore a copy of the database (or export the relevant tables) from **before** the delete, then merge or re-import rows as needed. This is the only way to get the **original** rows back intact.

2. **Re-create the person**  
   Use the school UI (or `POST /core/students/create/` and `POST /core/teachers/create/`) to add a new account with the same name and email.  
   - The new user gets a **new primary key** and a **new auth identity**; historical homework links belong to the old (deleted) student record and are **not** automatically reattached.

3. **Forensics on SQLite (development only)**  
   If the DB file was copied before vacuum/compaction and no backup exists, in theory deleted pages might still be recoverable with specialized tools; this is **fragile and not supported** by this project. Do not rely on it for production.

## Summary

**You cannot retrieve a deleted student or teacher through the backend API.** Plan for **backups** before bulk or risky deletes, and treat delete as **permanent** unless you restore from backup or manually re-create the user and accept new IDs.
