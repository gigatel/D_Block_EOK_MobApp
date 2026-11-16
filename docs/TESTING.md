# Testing

## Automated (Phase 1 — 127 tests, 12 suites)
```sh
npm run validate    # tsc --noEmit && eslint . && jest
```

| Suite | Covers |
|-------|--------|
| `src/theme/__tests__/engine.test.ts` | Token/content sanitisation (hostile input), yearly IST windows across New Year, priority → recent start → id tie-break, weather override (< 15), default fallback, WCAG AA contrast for all 15 built-in themes |
| `src/theme/__tests__/visuals.test.tsx` | Every pattern and decoration renders (hero + strip, reduce-motion path); unknown keys ignored |
| `src/utils/__tests__/date.test.ts` | IST formatting independent of device time zone, midnight crossover, "in N days" by calendar day |
| `src/services/api/__tests__/errors.test.ts` | ProblemDetails / `{ok:false,error}` / 429 `resendIn` / network / timeout mapping |
| `src/services/storage/__tests__/tokenStorage.test.ts` | Bearer token save/read/clear (Keychain mocked) |
| `src/features/auth/__tests__/*` | Mobile/password/OTP schemas, OTP resend countdown (fake timers) |
| `src/features/resident/__tests__/schemas.test.ts` | Complaint & comment validation |
| `src/features/admin/__tests__/admin.test.ts` | Announcement/event/album schemas, slugs, IST time slots, upload concurrency pool |
| `src/screens/public/__tests__/publicScreens.test.tsx` | Every public screen renders signed-out and signed-in |
| `__tests__/App.test.tsx` | Full app shell renders with the five tabs |

Jest notes: Reanimated is replaced by `jest/reanimatedMock.js`; lucide maps to its CJS build; Keychain and
haptics are mocked in `jest.setup.js`.

## Never test against the live database
Tests and demos use mock mode. For API integration tests (Phase 2) point the API at a separate database
(`ConnectionStrings__Default` → `dblockeok_test`, `Demo__Enabled=true`) and use fake `900000xxxx` numbers.

## Manual device checklist (Android first)
- [ ] Signed-out home: active theme hero + decorations animate; status bar icons readable.
- [ ] Resident OTP sign-in (9000000101 / 123456); wrong code shows attempts left; resend countdown.
- [ ] Admin OTP sign-in (9000000102 / 123456) → Committee tools visible; no password option anywhere.
- [ ] RSVP with adults/children; capacity message when over.
- [ ] Raise a complaint → appears with ticket number; admin changes status → timeline updates.
- [ ] Vote in a poll once; results animate; second vote refused.
- [ ] Theme studio → Preview a theme → banner "only you see this" → Back to live.
- [ ] Simulator: Republic Day / Holi / fog → expected theme.
- [ ] Upload queue: progress, `…fail…` file → Retry.
- [ ] Deep link: `adb shell am start -a android.intent.action.VIEW -d "dblockeok://events/diwali-milan"`.
- [ ] Settings → Motion: Reduced → decorations become static.
- [ ] Large font (Settings › Display › Font size max) and a 360 dp-wide device: no clipped text.

## Verified on
- Samsung SM-M066B (Android, arm64), debug build — Diwali theme live, admin two-step, theme preview, gallery.
- iOS simulator build (`xcodebuild`, Debug) — compiles; not yet run interactively.
