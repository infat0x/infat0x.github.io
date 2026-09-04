# Defeating Extension Spoofing: Magic Bytes Forensics

*Published: November 2025 | Tags: Digital Forensics, File Analysis, Defense*

## Introduction

Modern attack chains frequently conceal weaponized files behind misleading extensions (e.g. `invoice.pdf.exe` or using right-to-left override Unicode characters). Operating systems and users frequently rely on filename extensions to decide file handlers, creating an attack vector for payload delivery.

## File Signatures (Magic Bytes)

A file's true format is established by its binary header signature &mdash; a predetermined byte sequence located at offset `0x00`.

| Format | Magic Bytes (Hex) | ASCII |
|---|---|---|
| PNG | `89 50 4E 47 0D 0A 1A 0A` | `.PNG....` |
| JPEG | `FF D8 FF E0` or `FF D8 FF E1` | `....` |
| PDF | `25 50 44 46` | `%PDF` |
| Windows PE (EXE/DLL) | `4D 5A` | `MZ` |
| ELF Executable | `7F 45 4C 46` | `.ELF` |
| ZIP / Office DOCX | `50 4B 03 04` | `PK..` |

## magby: Client-Side Inspection Tool

To combat spoofing attacks without uploading sensitive files to third-party cloud scanners, I developed **magby**, an in-browser client-side forensics engine.

Using the HTML5 `FileReader` and `DataView` API, the tool inspects binary buffers directly:

```javascript
async function inspectMagicBytes(file) {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');

  if (hex.startsWith('4d 5a')) {
    return { type: 'Windows Executable (PE)', danger: 'HIGH' };
  }
  if (hex.startsWith('25 50 44 46')) {
    return { type: 'PDF Document', danger: 'LOW' };
  }
  return { type: 'Unknown', hex };
}
```

By cross-referencing the claimed extension against verified header signatures, extension spoofing is detected before execution.
