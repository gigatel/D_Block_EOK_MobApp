# App Store Connect — DblockEOK 1.0

Copy each block into the matching field in App Store Connect. Character counts are
checked against Apple's limits (shown as `used / limit`).

Fields marked **YOU FILL** need information only you have.

---

## 1. App Information  (Distribution → General → App Information)

| Field | Value |
|---|---|
| **Name** (`23 / 30`) | `D Block East of Kailash` |
| **Subtitle** (`29 / 30`) | `RWA notices, events & gallery` |
| **Bundle ID** | `com.dblockeok.gigatel` (already set) |
| **SKU** | `com.dblockeok.gigatel` (already set) |
| **Primary category** | Lifestyle |
| **Secondary category** | Utilities |
| **Content Rights** | "Yes, it contains, shows or accesses third-party content, and I have the necessary rights." The app shows notices and photos published by the RWA. |
| **Age Rating** | See section 5 |

> The record is currently named **DblockEOK**. Changing it to "D Block East of Kailash"
> reads better on the store. You can keep DblockEOK if you prefer.

---

## 2. Version 1.0 page  (Distribution → iOS App → 1.0 Prepare for Submission)

### Promotional Text (`157 / 170`)
```
Stay connected with D Block, East of Kailash. Notices, festivals, polls and photos from your RWA, plus one-tap calls to the managing committee and helplines.
```

### Description (`1492 / 4000`)
```
D Block East of Kailash is the app of the D Block Residents' Welfare Association (RWA), East of Kailash, New Delhi. Everything happening in our neighbourhood, in one place.

NOTICE BOARD
• Circulars, maintenance alerts and security updates from the RWA
• Search and filter by category; important notices stay pinned on top

EVENTS & FESTIVALS
• Upcoming festivals, meetings and community events
• RSVP for your family in a tap
• The app dresses up for Diwali, Holi, Chhath Puja and other festivals

MANAGING COMMITTEE
• Meet the elected committee and office bearers
• Call any member directly from the app
• Important contacts and helplines always at hand

COMPLAINTS
• Raise a complaint about electricity, water, sanitation, security and more
• Track it from Open to Resolved, with updates from the committee

POLLS
• Vote on decisions that affect the block
• See the results when a poll closes

PHOTO GALLERY
• Albums from festivals and community events
• See who shared each photo
• Committee members upload photos and videos straight from their phone; every file is checked for inappropriate content before upload
• Report any photo to the RWA office in one tap

SIMPLE, SECURE SIGN-IN
Sign in with the mobile number registered with the RWA and a one-time SMS code. No passwords to remember.

WHO CAN USE IT
This app is for residents of D Block, East of Kailash. Accounts are set up by the RWA office. If your number isn't registered yet, call the office straight from the sign-in screen.
```

### Keywords (`93 / 100`)
```
dblockeok,DblockEOK,RWA,residents,society,colony,welfare,EOK,New Delhi,notices,circular,festival,polls,complaints
```

### Support URL
```
https://dblockeok.com/contact
```

### Marketing URL (optional)
```
https://dblockeok.com
```

### Copyright
```
2026 Gigatel Solutions Private Limited
```
(Or `2026 D Block RWA, East of Kailash` if the RWA should be named as the owner.)

### Version / What's New
Version `1.0`. "What's New" isn't shown for a first release.

### Screenshots — iPhone 6.9" display
Upload from `docs/app-store/screenshots/` in this order (all 1320 × 2868):

1. `1-home-dashboard.png`: home with festival theme, quick actions, committee
2. `2-notice-board.png`: notices with categories and search
3. `3-events.png`: upcoming events
4. `4-managing-committee.png`: committee with one-tap call
5. `5-polls.png`: polls and results
6. `6-complaints.png`: complaint tracking
7. `7-photo-album.png`: festival album with uploader names
8. `8-sign-in.png`: mobile-number sign-in
9. `9-otp-verification.png`: SMS code verification

If App Store Connect only shows the **"iPhone with Dynamic Island (medium display)"** slot
(6.1"/6.3"), upload the copies in `docs/app-store/screenshots-6.3/` instead (1206 × 2622).
Apple scales whichever set you upload for the other iPhone sizes.
Resident details in shots 1, 2, 5 and 6 are fictional demo data ("Anjali Sharma, D-42").
The committee, event and album content is real public RWA content.

### App Review Information
| Field | Value |
|---|---|
| **Sign-in required** | Yes |
| **User name** | **YOU FILL:** the reviewer mobile number (10 digits) |
| **Password** | **YOU FILL:** the fixed OTP for that number (e.g. `123456`) |
| **Contact first / last name** | **YOU FILL** |
| **Contact phone** | **YOU FILL** (with +91) |
| **Contact email** | **YOU FILL**: someone who reads mail daily during review |

**Notes** (`1198 / 4000`)
```
DblockEOK is the app of the D Block Residents' Welfare Association (RWA), East of Kailash, New Delhi. It is used only by residents of this block and its elected committee.

SIGN-IN
Sign-in is by mobile number + one-time SMS code (there are no passwords). For review, the number in "User name" is a test account that accepts the fixed code given in, no SMS is sent. Enter the number, tap "Get OTP", then type the code.

ACCOUNTS
Resident accounts are created by the RWA office from its membership register; there is no in-app sign-up. Residents can ask the office to delete their account and data using the contact options on the sign-in screen or at https://dblockeok.com/contact.

USER-GENERATED CONTENT
Only committee members with upload permission can add photos or videos to the gallery. Every file is screened on the device by a nudity classifier before upload, and explicit files are blocked. Every photo has a Report (flag) button that emails the RWA office, which reviews reports and removes objectionable content within 24 hours. Residents cannot message each other.

DATA
No ads, no tracking and no third-party analytics. Data is stored on the RWA's own server (dblockeok.com).
```

### Build
Select the build uploaded from Xcode (1.0 (1)). Export compliance is already declared in the
build (`ITSAppUsesNonExemptEncryption = NO`), so App Store Connect won't ask.

---

## 3. Pricing and Availability
- **Price:** Free
- **Availability:** India (or all countries; residents abroad can still use it)
- **iPhone and iPad Apps on Apple Silicon Macs:** **untick**
- **Apple Vision Pro:** **untick**
- **Distribution method:** request **Unlisted App Distribution** (see section 6)

---

## 4. App Privacy  (Trust & Safety → App Privacy)

**Privacy Policy URL:** `https://dblockeok.com/privacy-policy`

**Do you or your third-party partners collect data from this app?** Yes

For **every** data type below, answer:
- Used for: **App Functionality** (only)
- Linked to the user's identity: **Yes**
- Used for tracking: **No**

| Category | Data type | What it is in this app |
|---|---|---|
| Contact Info | **Name** | Resident / committee member name |
| Contact Info | **Phone Number** | Mobile number used for OTP sign-in |
| Contact Info | **Physical Address** | Flat / house number in D Block |
| Identifiers | **User ID** | Account ID on the RWA server |
| User Content | **Photos or Videos** | Gallery uploads by committee members |
| User Content | **Other User Content** | Complaints, poll votes, event RSVPs |

**Not collected:** location, contacts, emails, browsing/search history, purchases,
financial info, health, diagnostics/crash data, usage data, advertising data.

This matches the privacy manifest shipped in the app (`PrivacyInfo.xcprivacy`).

---

## 5. Age Rating questionnaire

| Question | Answer |
|---|---|
| Violence (cartoon, realistic, prolonged, graphic) | None |
| Sexual content / nudity | None |
| Profanity or crude humour | None |
| Horror / fear themes | None |
| Alcohol, tobacco, drugs | None |
| Mature / suggestive themes | None |
| Simulated gambling / contests | None |
| Medical or treatment information | None |
| Unrestricted web access | No |
| **User-generated content** | **Yes**. Only committee members can upload photos, files are screened on the phone for nudity, and every photo has a Report button. |
| Messaging / chat between users | No |
| Advertising | No |
| Loot boxes / in-app purchases | No |

Apple works out the rating from these answers (expect 4+ to 13+ because of user-generated
content). Either is fine for this app.

---

## 6. Unlisted distribution (recommended)

An app for a single residents' association is often rejected from the public store
(Guideline 4.2 / 3.2) but approved as **unlisted**: it stays on the App Store and is
reachable only through its direct link. Steps:

1. Submit the request at **https://developer.apple.com/contact/request/unlisted-app/**
   (app name DblockEOK, Apple ID **6834789746**, explain it's for D Block residents only).
2. Submit the build for review as usual. If unlisted is approved, share the App Store link
   with residents (WhatsApp group, notice board, website).

---

## 7. TestFlight (internal testing)

**What to Test:**
```
Sign in with your registered mobile number and the SMS code (it fills in automatically on most phones). Check the home dashboard, notices, events, polls and complaints. Committee members: open the Gallery, tap the upload button, choose an album and add a few photos or a video. Explicit images should be blocked. Open any photo and try the Report button.
```

---

## Before you press "Submit for Review"
- [ ] Reviewer number with a **fixed OTP** works on the production server (no SMS needed)
- [ ] A committee member signed in by OTP sees Committee tools and the gallery Upload button
- [ ] The release build has been tested on a real iPhone through TestFlight
- [ ] `info@` / office email is checked daily (Report-photo emails go there)
- [ ] Mac and Vision Pro availability unticked; unlisted request sent
