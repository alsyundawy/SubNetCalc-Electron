# [Feature] Mulot/SubnetCalc Advanced Feature Integration & Quality Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the advanced subnetting capabilities of Julien Mulot's macOS `SubnetCalc` (FLSM, VLSM, CIDR Route Summarization, Subnet Bit Mapping, Reverse DNS `ip6.arpa`, CSV Exports) into `SubNetCalc-Electron` while hardening the codebase with comprehensive production engineering verification.

**Architecture:** Extend the pure, zero-dependency calculation engine in `src/engine/` with modular calculation units (`flsm.ts`, `vlsm.ts`, `cidr.ts`, `export.ts`). Expose these through React 19 tabbed views (`Calculator`, `FLSM`, `VLSM`, `Supernetting`) with interactive controls (sliders, dynamic tables, CSV download, bit visualizers).

**Tech Stack:** TypeScript 7.0, React 19.3, Electron 44.5, Vite 8.3, Vitest 5.0.

**Reference:** [mulot/SubnetCalc](https://github.com/mulot/SubnetCalc) & [Official Site](https://subnetcalc.mulot.org)

## Global Constraints

- Engine modules in `src/engine/` MUST remain pure TypeScript without Node.js, Electron, or DOM dependencies.
- All calculations must handle 32-bit unsigned integers safely without signed overflow (`>>> 0`).
- IPv6 calculations must use native `BigInt` for full 128-bit precision.
- No third-party calculation or subnet libraries allowed; must be implemented natively with 100% test coverage.
- UI styling must adhere strictly to the existing Dark/Light theme system without introducing Tailwind or unnecessary CSS bloat.
- All tasks must adhere to TDD Red-Green-Refactor cadence.

---

### Task 1: Engine Bug Fixes (RFC 3021 /31 & Class E)

**Files:**

- Modify: `src/engine/ipv4.ts:67-120`
- Test: `test/engine.spec.ts`

**Interfaces:**

- Consumes: `parseIPv4ToUint32`, `uint32ToIPv4`
- Produces: Corrected `CalculateResult` with accurate roles for `/31` and Class E.

- [x] **Step 1: Write the failing test**

```typescript
it("identifies both addresses in /31 as usable host interfaces per RFC 3021", () => {
  const res1 = calculateIPv4("10.0.0.0", 31);
  const res2 = calculateIPv4("10.0.0.1", 31);
  expect(res1.role).toBe("host");
  expect(res2.role).toBe("host");
  expect(res1.broadcast).toBeNull();
});

it("identifies 255.255.255.255 as Class E (Experimental / Reserved)", () => {
  const res = calculateIPv4("255.255.255.255", 32);
  const classProp = res.properties.find((p) => p.key === "Class");
  expect(classProp?.value).toBe("Class E");
});
```

- [x] **Step 2: Run test to verify failure**
      Run: `npm test`
      Expected: FAIL due to role mismatch on `/31` or Class E on `255.255.255.255`.

- [x] **Step 3: Implement the fix in `src/engine/ipv4.ts`**
      Update RFC 3021 role logic and Class E boundary check (`firstOctet <= 255`).

- [x] **Step 4: Run test to verify it passes**
      Run: `npm test`
      Expected: PASS.

---

### Task 2: Bit Classification String (`n`/`s`/`h`) & Reverse DNS Zones

**Files:**

- Create/Modify: `src/engine/format.ts`
- Modify: `src/engine/types.ts`
- Test: `test/engine.spec.ts`

**Interfaces:**

- Produces: `formatBitClassMap(addr: number, prefix: number): string`, `formatReverseDnsZone(address: string, family: 4 | 6): string`

- [x] **Step 1: Write the failing test**

```typescript
it("generates bit classification string with n, s, h characters", () => {
  // 10.32.2.52/30 (Class A: 8 net bits, 22 subnet bits, 2 host bits)
  const map = formatBitClassMap(0x0a200234, 30);
  expect(map).toBe("nnnnnnnn.ssssssss.ssssssss.sssssshh");
});

it("generates ip6.arpa reverse DNS zone string", () => {
  const arpa = formatReverseDnsZone("2001:db8::1", 6);
  expect(arpa).toBe(
    "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa",
  );
});
```

- [x] **Step 2: Run test to verify failure**
      Run: `npm test`

- [x] **Step 3: Implement minimal code**
      Implement `formatBitClassMap` and `formatReverseDnsZone`.

- [x] **Step 4: Run test to verify pass**
      Run: `npm test`
      Expected: PASS.

---

### Task 3: FLSM (Fixed Length Subnet Mask) Engine

**Files:**

- Create: `src/engine/flsm.ts`
- Modify: `src/engine/index.ts`
- Create: `test/flsm.spec.ts`

**Interfaces:**

- Produces: `calculateFLSM(network: string, prefix: number, subnetsNeeded: number): FLSMResult`

- [x] **Step 1: Write the failing test**

```typescript
describe("FLSM Calculation", () => {
  it("divides 192.168.1.0/24 into 4 equal subnets (/26)", () => {
    const res = calculateFLSM("192.168.1.0", 24, 4);
    expect(res.subnets.length).toBe(4);
    expect(res.allocatedPrefix).toBe(26);
    expect(res.subnets[0].subnetId).toBe("192.168.1.0");
    expect(res.subnets[0].broadcast).toBe("192.168.1.63");
    expect(res.subnets[0].hostRange.first).toBe("192.168.1.1");
    expect(res.subnets[0].hostRange.last).toBe("192.168.1.62");
    expect(res.subnets[0].usableHosts).toBe(62);
  });
});
```

- [x] **Step 2: Run test to verify failure**
      Run: `npm test`

- [x] **Step 3: Implement `calculateFLSM`**
      Compute required borrowed bits $b = \lceil \log_2(subnetsNeeded) \rceil$, new prefix $p = prefix + b$, and iterate through subnet offsets.

- [x] **Step 4: Run test to verify pass**
      Run: `npm test`
      Expected: PASS.

---

### Task 4: VLSM (Variable Length Subnet Mask) Engine

**Files:**

- Create: `src/engine/vlsm.ts`
- Modify: `src/engine/index.ts`
- Create: `test/vlsm.spec.ts`

**Interfaces:**

- Produces: `calculateVLSM(network: string, prefix: number, subnets: VLSMRequirement[]): VLSMResult`

- [x] **Step 1: Write the failing test**

```typescript
describe("VLSM Calculation", () => {
  it("allocates subnets in descending order to avoid overlap and wasted space", () => {
    const reqs = [
      { name: "LAN 1", hostsNeeded: 60 },
      { name: "LAN 2", hostsNeeded: 28 },
      { name: "WAN", hostsNeeded: 2 },
    ];
    const res = calculateVLSM("192.168.0.0", 24, reqs);
    expect(res.allocations[0].prefix).toBe(26); // 64 addresses
    expect(res.allocations[1].prefix).toBe(27); // 32 addresses
    expect(res.allocations[2].prefix).toBe(30); // 4 addresses
    expect(res.allocations[0].subnetId).toBe("192.168.0.0");
    expect(res.allocations[1].subnetId).toBe("192.168.0.64");
    expect(res.allocations[2].subnetId).toBe("192.168.0.96");
  });

  it("throws descriptive error when requirements exceed parent network capacity", () => {
    const reqs = [{ name: "Too Big", hostsNeeded: 300 }];
    expect(() => calculateVLSM("192.168.0.0", 24, reqs)).toThrow(/exceeds/i);
  });
});
```

- [x] **Step 2: Run test to verify failure**
      Run: `npm test`

- [x] **Step 3: Implement `calculateVLSM`**
      Sort requirements descending, find minimal prefix $32 - \lceil \log_2(hosts + 2) \rceil$, verify fit within base address block, calculate subnet ranges, and advance cursor.

- [x] **Step 4: Run test to verify pass**
      Run: `npm test`
      Expected: PASS.

---

### Task 5: CIDR Supernetting & Route Summarization

**Files:**

- Create: `src/engine/cidr.ts`
- Modify: `src/engine/index.ts`
- Create: `test/cidr.spec.ts`

**Interfaces:**

- Produces: `summarizeRoutes(routes: string[]): CIDRSummaryResult`

- [x] **Step 1: Write the failing test**

```typescript
describe("CIDR Supernetting", () => {
  it("aggregates 4 contiguous class C blocks into a single /22 route", () => {
    const routes = [
      "192.168.0.0/24",
      "192.168.1.0/24",
      "192.168.2.0/24",
      "192.168.3.0/24",
    ];
    const res = summarizeRoutes(routes);
    expect(res.aggregatedRoute).toBe("192.168.0.0/22");
    expect(res.supernetMask).toBe("255.255.252.0");
    expect(res.totalAddresses).toBe(1024);
  });
});
```

- [x] **Step 2: Run test to verify failure**
      Run: `npm test`

- [x] **Step 3: Implement `summarizeRoutes`**
      Find lowest and highest IP bounds, compute common leading bits, and construct aggregate CIDR block.

- [x] **Step 4: Run test to verify pass**
      Run: `npm test`
      Expected: PASS.

---

### Task 6: RFC 4180 CSV Exporter

**Files:**

- Create: `src/engine/export.ts`
- Modify: `src/engine/index.ts`
- Create: `test/export.spec.ts`

**Interfaces:**

- Produces: `exportToCsv<T>(data: T[], columns: { key: keyof T; label: string }[]): string`

- [x] **Step 1: Write the failing test**

```typescript
describe("CSV Export", () => {
  it("formats objects into RFC 4180 compliant CSV text", () => {
    const data = [
      { name: "LAN, Primary", subnetId: "192.168.1.0", mask: "255.255.255.0" },
    ];
    const csv = exportToCsv(data, [
      { key: "name", label: "Subnet Name" },
      { key: "subnetId", label: "Subnet ID" },
      { key: "mask", label: "Mask" },
    ]);
    expect(csv).toContain('"LAN, Primary",192.168.1.0,255.255.255.0');
  });
});
```

- [x] **Step 2: Run test to verify failure**
      Run: `npm test`

- [x] **Step 3: Implement `exportToCsv`**
      Handle string escaping, quotes for commas/newlines, and header row construction.

- [x] **Step 4: Run test to verify pass**
      Run: `npm test`
      Expected: PASS.

---

### Task 7: Multi-Tab UI Views & Integration

**Files:**

- Create: `src/renderer/components/TabsHeader.tsx`
- Create: `src/renderer/components/FlsmView.tsx`
- Create: `src/renderer/components/VlsmView.tsx`
- Create: `src/renderer/components/CidrView.tsx`
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/components/BitVisualizer.tsx`

- [x] **Step 1: Build Tabs Navigation**
      Add top tabs: `Calculator`, `FLSM (Fixed)`, `VLSM (Variable)`, `CIDR Supernetting`.

- [x] **Step 2: Build `FlsmView.tsx`**
      Provide base network input, slider for number of subnets, summary cards, interactive table, and CSV download button.

- [x] **Step 3: Build `VlsmView.tsx`**
      Provide base network input, table of subnets with "Add Subnet" row, custom name input, required hosts input, dynamic calculate trigger, visual allocation progress bar, and CSV export.

- [x] **Step 4: Build `CidrView.tsx`**
      Provide multi-route textarea, calculate summarization button, aggregate route card, and contiguous range verification.

- [x] **Step 5: Enhance `BitVisualizer.tsx`**
      Display character pattern (`nnnnnnnn.ssssssss.ssssssss.sssssshh`) alongside colored bit blocks.

---

### Task 8: Security, CSP & Quality Verification

**Files:**

- Modify: `src/renderer/index.html`

- [x] **Step 1: Harden CSP in `index.html`**
      Safely declare styles without unsafe sinks.
- [x] **Step 2: Run static scanner**
      Command: `bash ~/.gemini/config/skills/production-code-review/scripts/static-scan.sh .`
- [x] **Step 3: Run full typecheck and test suites**
      Command: `npm run typecheck && npm test`
      Expected: All tests pass with exit code `0`.
- [x] **Step 4: Verify zero CPU spikes and zero memory leaks**
      Inspect exit status and runtime metrics.
