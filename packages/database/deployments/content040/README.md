# CONTENT-040 activation package

Adds the 33 owner-approved card definitions with `starter=false`, and extends the existing receipt-gated equipment allowlist to the 34 approved equipment IDs and minimum levels. The package adds no acquisition source, price, offer, entitlement, inventory row, grant, receipt, XP, or currency.

Apply only the environment-specific SQL after the exact candidate CI and TEST release gates. The TEST and PROD packages have distinct project IDs, release scopes, and frozen starter hashes. Set `content040.target_project` in the same migration transaction. Never use an unrestricted `db push` for this package.

Rollback is allowed only before any ownership or equipment row exists for these new IDs; the rollback script checks that condition and restores the prior shop functions. No rollback has been executed.
