; -----------------------------------------------------------------------------
; SubNetCalc Electron - Custom NSIS Installer Script
; Lead Developer: Harry Dertin Sutisna (@alsyundawy) <alsyundawy@gmail.com>
; Architectural Lineage: Inspired by dail8859/NotepadNext installer architecture
; License: MIT
; -----------------------------------------------------------------------------

!macro customInstall
  DetailPrint "Registering SubNetCalc Electron in Windows App Paths..."
  ; Register SubNetCalc in Windows App Paths (enables launching via 'Run' dialog Win+R or CLI)
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\SubNetCalc Electron.exe" "" "$INSTDIR\SubNetCalc Electron.exe"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\SubNetCalc Electron.exe" "Path" "$INSTDIR"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\subnetcalc.exe" "" "$INSTDIR\SubNetCalc Electron.exe"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\subnetcalc.exe" "Path" "$INSTDIR"

  ; Register Application metadata in Windows Shell
  WriteRegStr SHCTX "Software\Classes\Applications\SubNetCalc Electron.exe" "FriendlyAppName" "SubNetCalc Electron"
  WriteRegStr SHCTX "Software\Classes\Applications\SubNetCalc Electron.exe" "ApplicationCompany" "Harry Dertin Sutisna Alsyundawy (@alsyundawy)"
  WriteRegStr SHCTX "Software\Classes\Applications\SubNetCalc Electron.exe" "ApplicationDescription" "High-Precision IPv4 and IPv6 Subnet Calculator with Multi-Cloud Profiles"
!macroend

!macro customUnInstall
  DetailPrint "Cleaning SubNetCalc Electron registry entries..."
  ; Remove App Paths
  DeleteRegKey SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\SubNetCalc Electron.exe"
  DeleteRegKey SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\subnetcalc.exe"

  ; Remove Application metadata
  DeleteRegKey SHCTX "Software\Classes\Applications\SubNetCalc Electron.exe"
!macroend
