# Active Directory Attack Paths: Notes from the Field

*Published: January 2026 | Tags: Active Directory, Red Team, OSCP*

## Initial Foothold to Domain Dominance

During penetration testing assessments of Windows enterprise networks, modern attack paths rarely rely on single software exploits. Instead, they chain together misconfigurations, excessive permissions, and legacy protocol fallbacks.

## Key Vectors

### 1. AS-REP Roasting
Accounts configured with `DONT_REQ_PREAUTH` return Kerberos AS-REP responses containing encrypted timestamps encrypted with the user's password hash without requiring domain authentication:

```bash
# Extract AS-REP roastable accounts with Impacket
GetNPUsers.py domain.local/ -no-pass -usersfile users.txt -format hashcat -output hashes.asreproast
```

### 2. Kerberoasting
Any domain user can request service tickets (TGS) for service accounts with registered Service Principal Names (SPNs). The encrypted ticket can then be cracked offline using Hashcat mode `13100`.

### 3. ACL Abuses & BloodHound
Graph theory reveals hidden relationships:
* `GenericAll` / `GenericWrite` on security groups
* `WriteDacl` allowing granting yourself `DCSync` rights
* Unconstrained delegation on computer accounts

```bash
# Executing DCSync once rights are established
secretsdump.py domain.local/compromised_user@10.10.10.10 -just-dc-user Administrator
```

## Defensive Hardening

1. Enforce Kerberos pre-authentication across all user objects.
2. Require 25+ character passwords for service accounts with SPNs (or migrate to gMSAs).
3. Continually audit and prune Active Directory ACL delegations.
