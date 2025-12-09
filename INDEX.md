# 🎯 Shopify Pixel Inspector - Project Index

> **Complete production-ready tooling suite for validating tag firing on Shopify Custom Pixel implementations**

---

## 📚 Documentation Map

### 🚀 Getting Started (Pick Your Level)

**👶 New to this? Start here:**

1. **[TLDR.md](TLDR.md)** ⭐⭐⭐ **ABSOLUTE BEGINNER START HERE**
   - 2-minute overview
   - 5-minute setup
   - Simple explanations
   - No technical jargon
   - **Read this first if you're new!**

**⚡ Need quick answers?**

2. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** ⭐⭐ QUICK COMMAND REFERENCE
   - Essential console commands
   - 3-command instant setup
   - Common troubleshooting
   - **Keep this open while working!**

**🎯 Working on Optimum Nutrition?**

3. **[GTM_CUSTOM_PIXEL_GUIDE.md](GTM_CUSTOM_PIXEL_GUIDE.md)** 🎯 **FOR OPTIMUM NUTRITION**
   - Understanding GTM Custom Pixel issues
   - Why GTM Preview doesn't work
   - How to validate without Preview mode
   - Working with clients on this setup
   - **Read this to understand the problem you're solving!**

4. **[OPTIMUM_NUTRITION_CHECKLIST.md](OPTIMUM_NUTRITION_CHECKLIST.md)** ✅ Testing Checklist
   - Step-by-step testing workflow
   - Pre-filled with Optimum Nutrition expectations
   - Documentation template
   - Client communication template

**📖 Detailed Guides:**

5. **[QUICK_START.md](QUICK_START.md)** 🚀 15-Minute Setup
   - Step-by-step deployment
   - First test instructions
   - Configuration walkthrough

6. **[README.md](README.md)** 📖 Main Reference
   - Complete feature overview
   - Usage instructions
   - Configuration guide
   - Commands reference

7. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** 📊 Project Info
   - What was built
   - File inventory
   - Technical specs
   - Success metrics

---

### 📁 Implementation Guides

4. **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** 🔧 Detailed Setup
   - Google Apps Script deployment
   - Google Sheets configuration
   - Browser installation (all methods)
   - Client-specific setup
   - Team onboarding
   - Security best practices

5. **[FILE_TREE.md](FILE_TREE.md)** 🌳 Project Structure
   - Complete file listing
   - File descriptions
   - Usage workflow
   - Maintenance tasks

---

### 🐛 Support & Reference

6. **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** 🆘 Problem Solving
   - Common issues & fixes
   - Diagnostic commands
   - Step-by-step debugging
   - Error reference database

7. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** 🏗️ Technical Deep-Dive
   - System architecture
   - Component details
   - Data flow diagrams
   - Performance specs
   - Extension points

---

### 🧪 Testing & QA

8. **[src/testing/testPlan.md](src/testing/testPlan.md)** ✅ Test Framework
   - 24 test scenarios
   - 6 test suites
   - Pass/fail checklists
   - Expected results

9. **[src/testing/sampleTestScenarios.md](src/testing/sampleTestScenarios.md)** 🔬 Test Scripts
   - Console test commands
   - Automated test generators
   - Shopify-specific tests
   - Performance tests

---

## 💻 Source Code

### Browser-Side Scripts

10. **[src/browser/consoleInterceptor.js](src/browser/consoleInterceptor.js)** 🎯 Main Script
    - Full interceptor implementation
    - ~800 lines, heavily documented
    - All features enabled
    - Production-ready

11. **[src/browser/devtoolsSnippet.js](src/browser/devtoolsSnippet.js)** 🛠️ DevTools Version
    - Optimized for Chrome DevTools Snippets
    - ~450 lines
    - Colored console output
    - **RECOMMENDED FOR DAILY USE**

12. **[src/browser/bookmarklet.js](src/browser/bookmarklet.js)** 🔖 Bookmarklet
    - Minified single-line version
    - ~200 lines (includes formatted reference)
    - Quick access option

---

### Server-Side Scripts (Google Apps Script)

13. **[src/apps-script/webhook.gs](src/apps-script/webhook.gs)** 📥 Webhook Receiver
    - HTTP POST handler
    - Event processing
    - Sheet management
    - ~450 lines

14. **[src/apps-script/reporting.gs](src/apps-script/reporting.gs)** 📊 Report Generator
    - Summary reports
    - Missing events detection
    - URL coverage matrix
    - Click analysis
    - ~600 lines

---

## 🗂️ Quick Navigation by Task

### I want to...

**Get started quickly**
→ [QUICK_START.md](QUICK_START.md)

**Understand what this does**
→ [README.md](README.md) (first 3 sections)

**Deploy to production**
→ [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

**Fix an error**
→ [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

**Run tests**
→ [src/testing/testPlan.md](src/testing/testPlan.md)

**Customize the code**
→ [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (Extension Points section)

**See all files**
→ [FILE_TREE.md](FILE_TREE.md)

**Understand the architecture**
→ [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

**Train a team member**
→ [QUICK_START.md](QUICK_START.md) + [README.md](README.md)

**Add a new client**
→ [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (Client-Specific Configuration)

---

## 📋 Implementation Checklist

Use this checklist to track your deployment:

### Setup Phase
- [ ] Read QUICK_START.md
- [ ] Deploy Google Apps Script
- [ ] Get webhook URL
- [ ] Create Google Sheet
- [ ] Install DevTools snippet
- [ ] Configure webhook URL in snippet
- [ ] Test with sample event

### Testing Phase
- [ ] Run test scenarios from testPlan.md
- [ ] Verify events in Google Sheet
- [ ] Generate all reports
- [ ] Test on live Shopify site
- [ ] Validate click tracking
- [ ] Check missing events report

### Production Phase
- [ ] Configure for client (update SITE_NAME)
- [ ] Populate Expectations sheet
- [ ] Train team members
- [ ] Document any customizations
- [ ] Set up monitoring schedule
- [ ] Share access to Google Sheet
- [ ] Bookmark important URLs

---

## 🎓 Learning Path

### Beginner (First Hour)
1. Read [QUICK_START.md](QUICK_START.md) (15 min)
2. Deploy system (15 min)
3. Send test events (10 min)
4. Review [README.md](README.md) commands section (10 min)
5. Practice on test site (10 min)

### Intermediate (Next Hour)
1. Read [testPlan.md](src/testing/testPlan.md) (20 min)
2. Complete test scenarios (30 min)
3. Generate and review reports (10 min)

### Advanced (Ongoing)
1. Study [ARCHITECTURE.md](docs/ARCHITECTURE.md)
2. Review source code with comments
3. Customize for specific needs
4. Extend with new features

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| **Apps Script Project** | https://script.google.com/u/0/home/projects/1eULLzAXi7T_kq_Fof0x3YRaBcPrEeGnKZduLuVIX198MsoUXxW0020EM/edit |
| **GitHub Repository** | https://github.com/bkaufman7/shopify-opt-neutrition-project |
| **Test Site** | https://www.optimumnutrition.com/ |
| **Google Sheets** | (Create your own - see QUICK_START.md) |

---

## 📞 Getting Help

### Self-Service Resources

1. **Error messages**: Search [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
2. **Usage questions**: Check [README.md](README.md)
3. **Setup issues**: Review [QUICK_START.md](QUICK_START.md)
4. **Technical details**: See [ARCHITECTURE.md](docs/ARCHITECTURE.md)

### Diagnostic Commands

Open browser console and run:

```javascript
// Check if loaded
typeof PixelInspector

// View stats
PixelInspector.stats()

// View config
PixelInspector.config

// Check webhook URL
console.log(PixelInspector.config.WEBHOOK_URL)
```

### Still Stuck?

1. Check browser console for errors
2. Check Apps Script execution log
3. Review [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) thoroughly
4. Create GitHub issue with:
   - What you did
   - What you expected
   - What actually happened
   - Error messages (if any)

---

## 🎯 Key Features at a Glance

✅ **Event Capture**
- Console.log interception
- DataLayer.push hooking
- DOM click tracking
- Shopify Custom Pixel events

✅ **Data Processing**
- Automatic normalization
- Configurable filtering
- Batching & queuing
- Retry logic

✅ **Storage & Analysis**
- Google Sheets integration
- Auto-archiving
- Multiple report types
- Missing events detection

✅ **Developer Experience**
- Multiple deployment options
- Extensive documentation
- Complete test suite
- Production-ready

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| **Total Files** | 17 |
| **Lines of Code** | ~2,520 |
| **Pages of Documentation** | ~110 |
| **Test Scenarios** | 24 |
| **Configuration Options** | 10+ |
| **Deployment Methods** | 3 |

---

## 🚦 Status

**Version**: 1.0.0  
**Status**: ✅ Complete & Production-Ready  
**Last Updated**: December 2025

**Ready to deploy**: YES  
**Ready to use**: YES  
**Ready for team**: YES

---

## 📝 Common Workflows

### Daily QA Testing
```
1. Open test page
2. F12 (DevTools)
3. Sources → Snippets → PixelInspector → Run
4. Interact with page
5. Check console for events
6. Review Google Sheet
```

### Weekly Reporting
```
1. Open Google Sheet
2. Pixel Inspector menu → Generate All Reports
3. Review Summary tab
4. Check Missing Events Report
5. Validate URL Coverage
6. Analyze Click Patterns
```

### Monthly Maintenance
```
1. Check error logs (Errors sheet)
2. Archive old data (if >50K rows)
3. Update Expectations
4. Review team access
5. Update documentation if needed
```

---

## 🎓 Training Materials

For onboarding new team members:

**Phase 1: Reading** (30 min)
- [QUICK_START.md](QUICK_START.md)
- [README.md](README.md) (Commands section)

**Phase 2: Hands-On** (30 min)
- Deploy system following QUICK_START.md
- Run test scenarios
- Generate reports

**Phase 3: Practice** (1 hour)
- Test on live site
- Complete test checklist
- Troubleshoot intentional errors

**Phase 4: Reference** (Ongoing)
- Bookmark this INDEX.md
- Refer to TROUBLESHOOTING.md as needed
- Review ARCHITECTURE.md for deep understanding

---

## 🎉 You're Ready!

This is a **complete, production-ready system** with:

✅ Full source code  
✅ Comprehensive documentation  
✅ Complete test suite  
✅ Deployment guides  
✅ Troubleshooting database  
✅ Architecture documentation

**Next Step**: Open [QUICK_START.md](QUICK_START.md) and deploy in 15 minutes!

---

**Questions?** Check the documentation first, then create a GitHub issue.

**Good luck!** 🚀
