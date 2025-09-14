# Reset PostgreSQL Password

Since PostgreSQL is installed but we don't know the password, here are the steps to reset it:

## Option 1: Use pgAdmin (Easiest)
1. Open pgAdmin 4 (should be installed with PostgreSQL)
2. It might prompt you to set a master password
3. Connect to the local PostgreSQL server
4. If it asks for a password, try common defaults: `postgres`, `password`, `admin`

## Option 2: Reset via Command Line
1. Stop the PostgreSQL service:
   ```powershell
   Stop-Service postgresql-x64-17
   ```

2. Start PostgreSQL in single-user mode (as Administrator):
   ```powershell
   & "C:\Program Files\PostgreSQL\17\bin\postgres.exe" --single -D "C:\Program Files\PostgreSQL\17\data" postgres
   ```

3. In the single-user mode, run:
   ```sql
   ALTER USER postgres PASSWORD 'password';
   ```

4. Exit and restart the service:
   ```powershell
   Start-Service postgresql-x64-17
   ```

## Option 3: Modify pg_hba.conf (Temporary)
1. Edit `C:\Program Files\PostgreSQL\17\data\pg_hba.conf`
2. Change the line:
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   ```
   to:
   ```
   host    all             all             127.0.0.1/32            trust
   ```
3. Restart PostgreSQL service
4. Connect without password and set a new one
5. Change pg_hba.conf back to `scram-sha-256`

## Option 4: Use Windows Authentication
Try connecting with your Windows user account instead of postgres user.

After setting the password, update the `.env` file with the correct password and run:
```bash
npm run db:setup
npm run migrate:up
```