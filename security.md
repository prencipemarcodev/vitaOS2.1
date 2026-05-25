# Security & Architecture Audit Prompt

## Obiettivo

Analizza questa codebase come se fossi contemporaneamente:

- Security Researcher
- Penetration Tester
- Backend Architect
- DevSecOps Engineer
- OWASP Auditor
- API Security Specialist
- Multi-tenant Systems Expert

L’obiettivo NON è spiegare genericamente il codice, ma individuare vulnerabilità, falle architetturali, problemi multiutente, endpoint esposti e superfici d’attacco.

---

# 1. Vulnerabilità Multiutente

Analizza possibili problemi legati a:

- Privilege Escalation
- Horizontal Privilege Escalation
- Vertical Privilege Escalation
- Broken Access Control
- Broken Object Level Authorization (BOLA / IDOR)
- Broken Function Level Authorization
- Cross-user Data Exposure
- Race Conditions
- Session Hijacking
- Session Fixation
- Multi-tenant Isolation Failures
- ACL/RBAC Bypass
- Trust eccessivo del frontend
- Mancata validazione lato server
- Concorrenza e sincronizzazione realtime
- Insecure Direct Object Reference
- Mass Assignment

Per ogni vulnerabilità:

- Descrivi il problema
- Spiega come può essere sfruttato
- Indica la gravità
- Mostra il possibile flusso d’attacco
- Suggerisci mitigazioni concrete
- Indica file/moduli coinvolti

---

# 2. Analisi API & Endpoint

Identifica automaticamente:

## Endpoint

- REST API
- GraphQL
- RPC
- WebSocket
- SSE/Event Streams
- Webhook
- Internal APIs
- Admin APIs
- Debug Routes
- Hidden Endpoints
- Legacy Routes

Per ogni endpoint analizza:

- Metodo HTTP
- Parametri
- Headers richiesti
- Tipo di autenticazione
- Possibili bypass auth
- Possibili enumeration
- Possibili IDOR
- Possibili injection
- Rate limiting
- Input validation
- Output exposure
- Logging sensibile

Controlla vulnerabilità come:

- SQL Injection
- NoSQL Injection
- SSRF
- CSRF
- RCE
- Command Injection
- Path Traversal
- File Upload Vulnerabilities
- Insecure Deserialization
- Prototype Pollution
- Open Redirect
- XXE
- Header Injection

Genera inoltre:

- API Inventory completo
- Mappa delle comunicazioni
- Diagramma logico dei servizi
- Elenco endpoint critici

---

# 3. Analisi Architetturale

Analizza:

- Trust Boundaries
- Authentication Flow
- Authorization Flow
- JWT Security
- Refresh Tokens
- Cookie Security
- Session Management
- Secret Management
- API Keys Exposure
- Environment Variables
- Database Permissions
- ORM Security
- Middleware Chain
- Reverse Proxy
- CDN
- Queue Systems
- Cache Layers
- Realtime Systems
- Microservices
- Edge Functions
- Serverless Functions

Individua:

- Single Point of Failure
- Escalation Paths
- Overprivileged Components
- Weak Isolation
- Dangerous Trust Assumptions
- Hidden Attack Surfaces

---

# 4. Frontend Security Analysis

Analizza:

- Stored XSS
- Reflected XSS
- DOM XSS
- CSP Weaknesses
- Client-side Secret Exposure
- localStorage Risks
- sessionStorage Risks
- Token Leakage
- Source Maps
- Debug Variables
- Hidden APIs
- Exposed Internal URLs
- Bundle Inspection
- Service Workers
- IndexedDB
- Offline Cache
- Client-side Validation Bypass

Controlla:

- fetch/axios calls
- websocket clients
- realtime subscriptions
- auth persistence
- hidden admin panels
- debug features

---

# 5. Database & Data Isolation

Verifica:

- Row Level Security
- User Isolation
- Tenant Isolation
- Missing WHERE Clauses
- Direct ID Exposure
- Metadata Leakage
- Backup Exposure
- Audit Logging
- Soft Delete Vulnerabilities
- Cascading Permission Problems
- Unsafe Queries
- ORM Misconfiguration

Controlla se un utente può:

- Leggere dati di altri utenti
- Modificare dati cross-user
- Enumerare utenti
- Accedere a record non autorizzati

---

# 6. Dependency & Supply Chain Security

Analizza:

- Vulnerable Dependencies
- Outdated Packages
- Malicious Packages
- Typosquatting Risks
- Dangerous postinstall Scripts
- Filesystem Access
- Network Access
- Supply Chain Attacks
- Dependency Confusion

Identifica:

- Librerie inutilizzate
- Pacchetti ad alto rischio
- Dipendenze con privilegi eccessivi

---

# 7. User Flow Security Testing

Simula flussi reali:

- Registrazione
- Login
- Password Reset
- Session Refresh
- File Upload
- Chat Realtime
- Notifications
- User Invites
- Role Changes
- Sharing
- Import/Export
- Team Collaboration
- Multi-device Sync

Per ogni flusso:

- Cerca bypass
- Cerca escalation
- Cerca data leakage
- Cerca race conditions
- Cerca manipolazioni richieste

---

# 8. Threat Modeling

Genera:

- Threat Model completo
- Attack Surface Map
- Attack Chains
- Exploit Chains
- Priorità remediation

Usa metodologie:

- OWASP
- STRIDE
- CWE
- CVSS

---

# 9. Analisi DevSecOps & Infrastructure

Controlla:

- Docker Security
- Container Privileges
- Kubernetes Security
- CI/CD Exposure
- Secrets nei workflow
- Build Pipelines
- Cloud Permissions
- IAM Policies
- Open Buckets
- Public Assets
- Infrastructure Misconfiguration

---

# 10. Output Richiesto

## Executive Summary

Fornisci:

- Vulnerabilità critiche
- Rischi principali
- Probabilità sfruttamento
- Impatto business

---

## Vulnerability Report

Per ogni vulnerabilità includi:

- Titolo
- Severità
- CWE
- CVSS
- Descrizione
- Impatto
- Scenario exploit
- Proof of Concept teorica
- File coinvolti
- Root Cause
- Fix suggerito

---

## API Inventory

Crea una tabella completa con:

| Endpoint | Metodo | Auth | Rischio | Note |
|---|---|---|---|---|

---

## Security Score

Assegna punteggi a:

- Backend Security
- Frontend Security
- API Security
- Multi-user Isolation
- Infrastructure Security
- Authentication
- Authorization
- Overall Security

---

## Hardening Recommendations

Suggerisci:

- Middleware sicurezza
- Rate limiting
- Audit logging
- Monitoring
- Input validation
- Server-side validation
- RBAC improvements
- Zero-trust architecture
- Security headers
- Isolation improvements
- Secret rotation
- Token hardening

---

# Modalità Analisi

Analizza il progetto assumendo che un attaccante esperto tenterà di:

- Manipolare richieste HTTP
- Modificare token JWT
- Falsificare sessioni
- Bypassare il frontend
- Enumerare utenti
- Estrarre dati cross-user
- Sfruttare race condition
- Abusare delle API
- Eseguire privilege escalation
- Cercare endpoint nascosti
- Analizzare bundle frontend
- Intercettare websocket
- Sfruttare error handling
- Cercare debug leaks
- Effettuare replay attack

Non limitarti alle vulnerabilità ovvie:
cerca anche edge cases, problemi logici, vulnerabilità architetturali profonde e combinazioni di exploit.