# SubNetCalc-Electron Attribution Notice

This project is an independent graphical user interface (GUI) and
calculation engine reimplementation in TypeScript/Electron inspired by the
behavioral specifications, network logic, and formatting conventions of:

1. **SubNetCalc (CLI)**
   Author & Copyright: Dr. Thomas Dreibholz
   Upstream Repository: <https://github.com/dreibh/subnetcalc>
   License: GPL-3.0-or-later

2. **SubnetCalc (macOS GUI)**
   Author & Copyright: Julien Mulot
   Upstream Repository: <https://github.com/mulot/SubnetCalc>
   Website: <https://subnetcalc.mulot.org>
   License: GPL-2.0-or-later

## Architectural and Intellectual Property Statement

- This project does **NOT** contain, copy, or bundle any C++ or Swift source code
  from the original `subnetcalc.cc` or `mulot/SubnetCalc` codebases.
- The calculation engine is written entirely from scratch in pure
  TypeScript according to standard Internet Engineering Task Force (IETF)
  RFCs (RFC 791, RFC 4291, RFC 4193, RFC 5952, RFC 3021, RFC 1918, RFC 4180).
- We gratefully acknowledge Dr. Thomas Dreibholz and Julien Mulot for establishing
  the standard CLI ergonomics, IPv6 property definitions, FLSM/VLSM workflows,
  and subnetting interfaces that inspired this modern software.
