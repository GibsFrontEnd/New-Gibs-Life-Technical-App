---
name: csu-customers-schema-mismatch
description: CSU Customers API returns an insured-schema model that doesn't match the UI's customer fields; remap deferred
metadata:
  type: project
---

The CSU Customers feature calls `GET/POST/PUT/DELETE {API_BASE_URL}/v1/Customers` (base from public/config.js → https://lifetechnicalapi.newgibsonline.com/api). The 404 that previously broke "Error Loading Customers" was a missing `v1/` prefix — fixed in `src/features/reducers/csuReducers/customerSlice.ts`, along with `Bearer ` auth-header consistency and unwrapping the `{ data: [...] }` list envelope.

The API uses an insured/party schema: `insuredID` (===customerID), `surName`, `otherNames`, `fullName`, `title`, `mobilePhone`, `landphone`, `state`, `country`, `sex`, `maritalStatus`, `occupation`, `nationalID`, `dateofBirth`, `age`, `active` (1/0), `clientType` ("INDIVIDUAL"/…), `remarks`, `submittedBy/On`, `modifiedBy/On`. No `nextOfKin`/`kyc*`/`orgName`.

**Done (2026-06-21):**
- `types/customer.ts` `Customer` interface remapped to the insured schema.
- `customerSlice.ts`: added `getCustomer` thunk → `GET /v1/Customers/{insuredID}` (sets `currentCustomer`, has loading/error.getCustomer); delete now matches on `insuredID`.
- `customers.customers.tsx` table remapped (dropped Customer ID column; Name/Type/Email/Phone/State/Status columns; filter+stats use `clientType`/`active`; View dispatches `getCustomer(insuredID)`).
- `components.customers.tsx` `CustomerDetails` remapped to insured fields (removed KYC/NextOfKin/Policies sections that don't exist in the API).

**Still pending — Create/Edit forms NOT remapped:** `CreateCustomer`/`EditCustomer` in `components.customers.tsx` still build the old payload (`firstName`, `isOrg`, `nextOfKin`, `kyc*`). The POST/PUT contract is unverified — **probe the create/update endpoint for the accepted body before remapping the forms** rather than guessing fields.
