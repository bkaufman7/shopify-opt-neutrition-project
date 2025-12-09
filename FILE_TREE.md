# Project File Tree

```
shopify-opt-neutrition-project/
│
├── 📄 TLDR.md                           # ⭐ START HERE - 2-minute overview (beginners)
├── 📄 QUICK_REFERENCE.md                # ⚡ Quick command reference (all levels)
├── 📄 GTM_CUSTOM_PIXEL_GUIDE.md         # 🎯 GTM Custom Pixel complete guide (Optimum Nutrition)
├── 📄 OPTIMUM_NUTRITION_CHECKLIST.md    # ✅ Testing checklist (project-specific)
├── 📄 INDEX.md                          # 📑 Master navigation guide
├── 📄 README.md                         # 📖 Main documentation & usage guide
├── 📄 QUICK_START.md                    # 🚀 15-minute setup guide
├── 📄 PROJECT_SUMMARY.md                # 📊 Complete project overview
├── 📄 FILE_TREE.md                      # 🌳 This file - project structure
│
├── 📁 src/
│   ├── 📁 browser/                      # Browser-side code
│   │   ├── consoleInterceptor.js       # Main interceptor script (~800 lines)
│   │   ├── devtoolsSnippet.js          # DevTools snippet version (~450 lines)
│   │   ├── bookmarklet.js              # Minified bookmarklet (~200 lines)
│   │   └── configHelper.js             # ⭐ Interactive configuration helper (NEW)
│   │
│   ├── 📁 apps-script/                 # Google Apps Script code
│   │   ├── webhook.gs                  # Webhook receiver (~450 lines)
│   │   └── reporting.gs                # Report generators (~600 lines)
│   │
│   ├── 📁 sheets/                      # Google Sheets templates
│   │   └── 📁 templates/               # (Auto-created by webhook)
│   │
│   └── 📁 testing/                     # Test documentation
│       ├── testPlan.md                 # Comprehensive test plan (24 tests)
│       └── sampleTestScenarios.md      # Test scripts & scenarios
│
├── 📁 docs/                            # Extended documentation
│   ├── DEPLOYMENT.md                   # Detailed deployment guide (15 pages)
│   ├── TROUBLESHOOTING.md              # Issue resolution guide (20 pages)
│   └── ARCHITECTURE.md                 # Technical architecture (25 pages)
│
├── 📄 .clasp.json                      # Apps Script project configuration
├── 📄 appsscript.json                  # Apps Script manifest
├── 📄 webhook.gs                       # Apps Script webhook (root copy)
└── 📄 reporting.gs                     # Apps Script reporting (root copy)
```

---

## File Descriptions

### 📄 Root Documentation (Start Here)

**TLDR.md** ⭐ **ABSOLUTE BEGINNER START**
- 2-minute overview for all skill levels
- 5-minute quick setup
- Plain English explanations
- No technical jargon
- FAQ for common questions
- **Start here if you're new or just need the basics!**

**QUICK_REFERENCE.md** (Essential Commands)
- All console commands on one page
- Quick troubleshooting steps
- 3-command instant setup
- Common use cases
- Keep this open while working
- **Your daily cheat sheet**

**GTM_CUSTOM_PIXEL_GUIDE.md** (Understanding the Problem)
- Why GTM Preview doesn't work with Custom Pixels
- How Shopify Custom Pixels differ from theme.liquid
- Console-based validation techniques
- Professional client communication templates
- Step-by-step Optimum Nutrition workflow
- **Read this to understand what you're dealing with**

**OPTIMUM_NUTRITION_CHECKLIST.md** (Project-Specific Testing)
- Complete testing workflow for Optimum Nutrition
- Pre-filled event expectations
- Documentation templates
- Client communication templates
- Finding tracking form
- **Your testing playbook**

**INDEX.md** (Master Navigation)
- Complete project navigation
- Guides you to the right document
- Organized by skill level and task
- **Lost? Start here**

**README.md** (Main Entry Point)
- Complete usage guide
- Architecture overview
- Configuration instructions
- Quick reference
- ~400 lines of documentation

**QUICK_START.md** (Get Started Fast)
- 15-minute setup guide
- Step-by-step deployment
- First-time usage
- Troubleshooting common setup issues

**PROJECT_SUMMARY.md** (Project Overview)
- What was built
- File inventory
- Technical specifications
- Success metrics
- Next steps

---

### 📁 src/browser/ (Browser Scripts)

**consoleInterceptor.js** (Production Script)
- Full-featured interceptor
- Extensive comments & documentation
- All configuration options
- Modular functions
- Production-ready
- **Deploy**: Copy to page or inject via snippet

**devtoolsSnippet.js** (DevTools Version) ⭐ **RECOMMENDED**
- Optimized for DevTools Snippets
- Colored console output
- Built-in commands reference
- Initialization checks
- **Deploy**: Create snippet in Chrome DevTools
- **This is what you'll use most**

**configHelper.js** (Interactive Setup) ⭐ **NEW**
- Interactive console-based configuration wizard
- No manual code editing required
- Quick presets (e.g., Optimum Nutrition)
- Generates ready-to-paste configuration
- **Deploy**: Paste in console, follow prompts
- **Perfect for beginners!**

**bookmarklet.js** (Quick Access)
- Minified single-line version
- Human-readable reference version
- Installation instructions
- **Deploy**: Create browser bookmark

---

### 📁 src/apps-script/ (Backend Code)

**webhook.gs** (Event Receiver)
- HTTP POST handler (doPost)
- Event processing pipeline
- Sheet management
- Auto-archiving
- Error handling
- Batch writing
- **Deploy**: Via Google Apps Script

**reporting.gs** (Analytics & QA)
- Summary report generator
- Missing events detector
- URL coverage matrix
- Click analysis
- Custom menu integration
- Expectations framework
- **Deploy**: Via Google Apps Script

---

### 📁 src/testing/ (Quality Assurance)

**testPlan.md** (Test Framework)
- 6 test suites
- 24 individual test scenarios
- Pass/fail checklist
- Expected results
- Browser compatibility tests
- Performance benchmarks

**sampleTestScenarios.md** (Test Scripts)
- Console commands for testing
- Shopify-specific test cases
- Automated test generators
- Visual test checklist
- Performance testing scripts
- Error simulation tests

---

### 📁 docs/ (Extended Documentation)

**DEPLOYMENT.md** (Setup Guide)
- Detailed deployment instructions
- Apps Script setup
- Google Sheets configuration
- Browser interceptor installation
- Client-specific configuration
- Team onboarding
- Production deployment checklist
- Security best practices

**TROUBLESHOOTING.md** (Issue Resolution)
- Common issues & solutions
- Diagnostic commands
- Error categories
- Step-by-step debugging
- Advanced debugging techniques
- Known limitations
- Emergency procedures

**ARCHITECTURE.md** (Technical Deep-Dive)
- System architecture diagram
- Component details
- Data flow
- Security architecture
- Performance characteristics
- Scalability analysis
- Extension points
- Deployment patterns

---

### 📁 Apps Script Files

**.clasp.json** (Configuration)
```json
{
  "scriptId": "1eULLzAXi7T_kq_Fof0x3YRaBcPrEeGnKZduLuVIX198MsoUXxW0020EM",
  "rootDir": "."
}
```

**appsscript.json** (Manifest)
```json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

**webhook.gs** & **reporting.gs** (Root Copies)
- Copies of src/apps-script files
- Used by clasp for deployment
- Keep in sync with src versions

---

## File Statistics

| Category | Files | Lines of Code | Pages of Docs |
|----------|-------|---------------|---------------|
| **New Beginner-Friendly Docs** | **5** | - | **~25** |
| Browser Scripts | 4 | ~1,650 | - |
| Apps Script | 2 | ~1,050 | - |
| Core Documentation | 4 | - | ~50 |
| Extended Documentation | 3 | - | ~60 |
| Testing | 2 | - | ~30 |
| Configuration | 2 | ~20 | - |
| **TOTAL** | **22** | **~2,720** | **~165** |

---

## Key Features by File

### Event Capture (consoleInterceptor.js)
✅ Console.log interception  
✅ DataLayer.push hooking  
✅ DOM click tracking  
✅ Event normalization  
✅ Configurable filtering  
✅ Batching & queuing  

### Data Processing (webhook.gs)
✅ POST request handling  
✅ JSON parsing  
✅ Event validation  
✅ Sheet auto-creation  
✅ Auto-archiving  
✅ Error logging  

### Reporting (reporting.gs)
✅ Summary report  
✅ Missing events detection  
✅ URL coverage matrix  
✅ Click analysis  
✅ Custom expectations  
✅ Apps Script menu  

### Documentation (docs/)
✅ Complete deployment guide  
✅ Troubleshooting database  
✅ Architecture documentation  
✅ Quick start guide  
✅ Test framework  
✅ Best practices  

---

## Usage Workflow

```
1. Read: README.md
   ↓
2. Deploy: Follow QUICK_START.md
   ↓
3. Configure: Update webhook URL in devtoolsSnippet.js
   ↓
4. Test: Run test scenarios from testPlan.md
   ↓
5. Use: Run snippet on target pages
   ↓
6. Analyze: Generate reports in Google Sheets
   ↓
7. Troubleshoot: Refer to TROUBLESHOOTING.md if issues
   ↓
8. Extend: Review ARCHITECTURE.md for customization
```

---

## Deployment Checklist

### Phase 1: Setup (Use QUICK_START.md)
- [ ] Deploy Apps Script (webhook.gs + reporting.gs)
- [ ] Get webhook URL
- [ ] Create Google Sheet
- [ ] Install browser snippet
- [ ] Configure webhook URL

### Phase 2: Testing (Use testPlan.md)
- [ ] Send test event
- [ ] Verify in Google Sheet
- [ ] Generate reports
- [ ] Test on live site
- [ ] Complete test scenarios

### Phase 3: Production (Use DEPLOYMENT.md)
- [ ] Configure for client site
- [ ] Populate expectations
- [ ] Train team members
- [ ] Document customizations
- [ ] Set up monitoring

---

## Maintenance Tasks

### Weekly
- Review error logs (Errors sheet)
- Check event counts (Summary report)

### Monthly
- Archive old data (if >50K rows)
- Update expectations
- Review missing events report

### Quarterly
- Update documentation
- Review security settings
- Audit sheet access
- Update code if needed

---

## Extension Guide

### To Add New Event Type
1. Edit: `src/browser/consoleInterceptor.js` → `isEventObject()`
2. Edit: `src/browser/consoleInterceptor.js` → `normalizeEvent()`
3. Edit: `src/apps-script/webhook.gs` → `EVENT_HEADERS`
4. Edit: `src/apps-script/webhook.gs` → `buildEventRow()`

### To Add New Report
1. Edit: `src/apps-script/reporting.gs` → Add new function
2. Edit: `src/apps-script/reporting.gs` → `onOpen()` menu
3. Test: Run function from Apps Script editor
4. Document: Update README.md

### To Add New Client
1. Edit: `src/browser/consoleInterceptor.js` → `SiteConfig`
2. Update: `SITE_NAME` constant
3. Create: New Google Sheet (or tab)
4. Deploy: Follow QUICK_START.md

---

## Support Resources

| Issue | Resource |
|-------|----------|
| Setup problems | QUICK_START.md |
| Usage questions | README.md |
| Errors/bugs | TROUBLESHOOTING.md |
| Deployment | DEPLOYMENT.md |
| Architecture | ARCHITECTURE.md |
| Testing | testPlan.md |
| Code reference | Source files (heavily commented) |

---

## Version Control

**Current Version**: 1.0.0

**Git Repository**: https://github.com/bkaufman7/shopify-opt-neutrition-project

**Apps Script**: https://script.google.com/u/0/home/projects/1eULLzAXi7T_kq_Fof0x3YRaBcPrEeGnKZduLuVIX198MsoUXxW0020EM/edit

**Deployment**: 
```bash
# Pull latest from Apps Script
clasp pull

# Push updates to Apps Script
clasp push
```

---

## Quick File Access

**Most Used Files**:
1. `QUICK_START.md` - First-time setup
2. `src/browser/devtoolsSnippet.js` - Daily use
3. `README.md` - Reference
4. `docs/TROUBLESHOOTING.md` - When issues occur
5. `src/testing/testPlan.md` - QA validation

**Development Files**:
1. `src/browser/consoleInterceptor.js` - Main logic
2. `src/apps-script/webhook.gs` - Backend receiver
3. `src/apps-script/reporting.gs` - Analytics
4. `docs/ARCHITECTURE.md` - Technical reference

**Documentation Files**:
1. `README.md` - Overview
2. `QUICK_START.md` - Setup
3. `docs/DEPLOYMENT.md` - Detailed deployment
4. `docs/TROUBLESHOOTING.md` - Issue resolution
5. `PROJECT_SUMMARY.md` - Project info

---

**Total Project Size**: ~2,500 lines of code + ~11,000 lines of documentation
