---
title: כלי CLI מודרניים
sidebar_position: 3
---

# כלי CLI מודרניים לתהליכי עבודה מרובי סוכנים

[טרמינלים מודרניים](/developer-tools/terminals) בשילוב עם כלי CLI מגיעים לאותן יכולות (feature parity) של IDEs מסורתיים - ripgrep + fzf לחיפוש גלובלי, yazi לחקירת קבצים, tmux/Zellij לניהול panes, lazygit לפעולות git. לפיתוח מרובה סוכנים, סטאק (stack) זה הופך לתשתית קריטית: persistence של סשנים לאורך ניתוקים, מעבר קונטקסט מהיר בין worktrees, ופעולות קבצים יעילות מבלי לשבור תהליך העבודה.

**שבע קטגוריות:** חיפוש וגילוי (ripgrep, fd), עריכת טקסט ובדיקה (micro, bat), ניווט קבצים (eza, yazi, fzf, zoxide), ניהול סשנים (tmux, Zellij), היסטוריית shell (Atuin), פעולות git (lazygit), ואוטומציית דפדפן (agent-browser) מטפלות במשימות CLI התכופות ביותר בתהליכי עבודה של פיתוח מרובה סוכנים.

## כלי חיפוש וגילוי

### ripgrep

![תוצאות חיפוש ripgrep עם התאמות תבנית צבעוניות ומספרי שורות](https://burntsushi.net/stuff/ripgrep1.png)

[**ripgrep**](https://github.com/BurntSushi/ripgrep) הוא כלי חיפוש מוכוון-שורות מבוסס Rust שמשלב את המהירות של כלים מתמחים עם הגמישות של grep. binary יחיד, ללא תלויות, תמיכה חוצת-פלטפורמות.

**מאפיינים מבדלים עיקריים:** מהיר פי 10-20 מ-grep כברירת מחדל, קריטי כש סוכנים מבצעים עשרות חיפושים למשימה בודדת. מכבד קבצי `.gitignore`, `.ignore` ו-`.hgignore` כברירת מחדל, מסנן אוטומטית node_modules, artifacts של build ותלויות מנוהלות-גרסאות - מפחית התאמות לא רלוונטיות ושגיאות פרסור. חיפוש רקורסיבי בתיקיות הוא ברירת מחדל (`rg pattern` מחפש מהתיקייה הנוכחית כלפי מטה) במקום לדרוש flags מפורשים של `-r`. תמיכת regex באמצעות מנוע regex של Rust עם lookahead/lookbehind, מודעות Unicode ושוויון תכונות PCRE. תומך בחיפוש מרובה-שורות עם flag של `--multiline-dotall`. מוכן לאינטגרציה עם fzf, ripgrep-all (`rga`) לחיפוש PDFs/archives/קבצים דחוסים, ופורמטים מרובים של פלט (JSON, CSV, טקסט רגיל).

**מתאים במיוחד ל:** מפתחים שמבצעים מחקר מהיר מרובה סוכנים על פני בסיסי קוד, שבהם ביצועי חיפוש מצטברים על פני עשרות שאילתות מקבילות. מהנדסים שמנהלים מאגרים גדולים (100k+ קבצים) שבהם grep נהיה איטי באופן מורגש. צוותים שמשתמשים ב-ripgrep לאורך סקריפטי פיתוח, Makefiles ו-pipelines של CI/CD שבהם מודעות ל-`.gitignore` מפחיתה false positives.

**פשרות:** הבדלים במנוע regex של Rust משמעותם שכמה תבניות regex מתקדמות של Perl עשויות לא לעבוד (אם כי הכיסוי נרחב). כיבוד ברירת המחדל של `.gitignore` יכול להפתיע משתמשים שמצפים לחיפוש אוניברסלי של grep - דורש flag של `--no-ignore` לעקיפה, מוסיף עומס קוגניטיבי למקרי קצה. מוגבל לפלט מוכוון-שורות; חיפוש בתוך קבצים בינאריים או מבנים מקוננים עמוקות דורש flags נוספים או כלים משלימים.

**התקנה:**

```bash
# macOS
brew install ripgrep

# Cargo (Rust)
cargo install ripgrep

# Linux package managers
sudo apt install ripgrep     # Debian/Ubuntu
sudo pacman -S ripgrep       # Arch
```

### fd

![חיפוש קבצים fd עם פלט צבעוני המציג תיקיות וסוגי קבצים](https://github.com/sharkdp/fd/raw/master/doc/screencast.svg)

[**fd**](https://github.com/sharkdp/fd) הוא תחליף ל-find מבוסס Rust מותאם לפשטות וביצועים. binary יחיד, אפס תלויות, תמיכה חוצת-פלטפורמות.

**מאפיינים מבדלים עיקריים:** פלט צבעוני לתיקיות, symlinks ו-executables כברירת מחדל ללא עומס flags. תמיכה משתמעת בקבצי `.gitignore` ו-`.ignore` מדלגת על תיקיות מוסתרות ותבניות מתעלמות אוטומטית (השתמשו ב-`--no-ignore` לעקיפה). ביצוע מקביל על פני ליבות CPU לסריקות תיקיות גדולות (4 workers ברירת מחדל, ניתן להגדרה דרך `--threads`). תחביר תבנית regex-first מנצח את הביטויים המסובכים של find של `-name` ו-`-type`. piping נקי ל-xargs/parallel/ripgrep ללא צורך בעקיפות `-print0`. ברירות מחדל הגיוניות (case-insensitive ב-macOS, קבצים מוסתרים מוחרגים, תמיכת צבע) לא דורשות תצורה.

**מתאים במיוחד ל:** מהנדסים שבונים סקריפטים מרובי-סוכנים שסורקים worktrees גדולים ללא ניהול ignore ידני. מפתחים שמגלים תבניות קבצים לאינטגרציית ripgrep - פלט fd מזין באופן טבעי ripgrep לתהליכי עבודה של חיפוש קוד. משתמשים שעובדים על פני git worktrees שצריכים מיקום קבצים מיידי ללא תחביר find מורכב.

**פשרות:** תחביר שונה מ-POSIX find משמעו שסקריפטים דורשים תרגום כשמעבירים בין מערכות. כמה אפשרויות find מתקדמות (שרשראות פעולה מורכבות, `-exec` עם מספר תנאים) לא נתמכות ישירות - fallback מזדמן ל-find עדיין נדרש. פלט צבעוני מוסיף רעש ב-pipes אלא אם כן מושבת מפורשות (אם כי fd מזהה אוטומטית כשמעובר ב-pipe ומשבית צבעים).

**התקנה:**

```bash
# macOS
brew install fd

# Cargo (Rust)
cargo install fd-find

# Linux package managers
sudo apt install fd-find       # Debian/Ubuntu
sudo pacman -S fd              # Arch
```

## עריכת טקסט ובדיקה

### micro

![עורך micro עם ערכת נושא solarized המציגה הדגשת תחביר וסרגל מצב](https://github.com/zyedidia/micro/raw/master/assets/micro-solarized.png)

[**micro**](https://micro-editor.github.io/) הוא עורך טקסט בטרמינל (terminal text editor) מבוסס Go שמביא keybindings דמויי-GUI לשורת הפקודה. binary יחיד, ללא תלויות, תמיכה חוצת-פלטפורמות.

**מאפיינים מבדלים עיקריים:** Ctrl+S לשמירה, Ctrl+Q ליציאה, Ctrl+F לחיפוש - לא נדרשת עריכה מודאלית או שינון. הדגשת תחביר ל-130+ שפות מהקופסה. תמיכה מרובת-cursors (בסגנון Sublime) לעריכה מקבילה. מערכת plugins של Lua להרחבה. טרמינל משולב ותמיכת עכבר לתהליכי עבודה היברידיים של מקלדת/עכבר.

**מתאים במיוחד ל:** מפתחים שצריכים עריכות מהירות בקונטקסט סוכן מבלי לעבור ל-IDE. מהנדסים שרואים את העריכה המודאלית של Vim כ-overkill לשינויי שורה אחת. משתמשים שרוצים עריכה טרמינלית עם keybindings מוכרים של עורך מודרני (שמגיעים מ-VSCode, Sublime או עורכי GUI דומים).

**פשרות:** מינימלי בתכונות בהשוואה ל-IDEs - ללא אינטגרציית LSP, כלי refactoring מוגבלים, ניווט בסיסי. לא חזק כמו Vim/Neovim לפעולות מורכבות מרובות-קבצים או מניפולציית text objects מתקדמת. לקבצים גדולים (1000+ שורות) או חקירת קוד עמוקה, IDE נשאר בחירת כלי עדיפה.

**התקנה:**

```bash
# macOS
brew install micro

# Linux (binary)
curl https://getmic.ro | bash

# Cross-platform (Go)
go install github.com/zyedidia/micro/cmd/micro@latest
```

דרישות: אין (binary סטטי). אופציונלי: תמיכת clipboard דרך xclip/xsel ב-Linux.

### Fresh

![עורך Fresh בטרמינל המציג command palette לגילוי תכונות](https://sinelaw.github.io/fresh/docs/assets/palette.png)

[**Fresh**](https://sinelaw.github.io/fresh/) הוא עורך טרמינלי מבוסס Rust שתוכנן לגילוי ומהירות. מביא שימושיות דמוית-GUI (keybindings סטנדרטיים, תמיכת עכבר, command palette) לטרמינל עם אינטגרציית LSP.

**מאפיינים מבדלים עיקריים:** עריכה לא-מודאלית עם keybindings מוכרים (Ctrl+S, Ctrl+Z, Ctrl+F) - לא נדרשת עקומת למידה של Vim. תמיכת עכבר מלאה עם סרגל תפריטים ו-command palette לגילוי תכונות. אינטגרציית LSP מספקת go-to-definition, diagnostics inline, תיעוד hover ו-code actions. מטפל בקבצים של 10GB+ מיידית דרך piece tree עם lazy-loading (~36MB זיכרון לקובץ 2GB לעומת ~2GB ל-Neovim). מערכת plugins של TypeScript/Deno רצה בסביבה sandboxed להרחבה מאובטחת ומודרנית. סייר קבצים מובנה וטרמינל משולב.

**מתאים במיוחד ל:** מפתחים שרוצים עריכה טרמינלית דמוית-IDE ללא עומס עריכה מודאלית. מהנדסים שעובדים עם קבצי log גדולים או קבצי נתונים שבהם עורכים אחרים נאבקים או קורסים. משתמשים שרוצים את הנגישות של micro בשילוב עם אינטליגנציית קוד מונעת-LSP. צוותים שצריכים הרחבה דרך מערכת TypeScript מוכרת במקום Lua או Vimscript.

**פשרות:** פרויקט חדש יותר עדיין מתבגר - קהילה ומערכת אקולוגית של plugins קטנות יותר מעורכים מבוססים. דורש Deno runtime לפיתוח plugins. פחות מבוסס ומוכח (battle-tested) מ-micro למשימות עריכה פשוטות. כמה תהליכי עבודה מתקדמים של Vim/Neovim (מקרואים מורכבים, שרשראות plugins נרחבות) עדיין לא משוכפלים.

**התקנה:**

```bash
# macOS
brew tap sinelaw/fresh && brew install fresh-editor

# Cargo (Rust)
cargo install fresh-editor

# npm (cross-platform)
npm install -g @fresh-editor/fresh-editor

# Linux package managers
yay -S fresh-editor          # Arch (AUR)
```

דרישות: אין (binary סטטי). אופציונלי: Deno לפיתוח plugins.

### bat

![bat מציג קוד עם הדגשת תחביר, מספרי שורות ואינטגרציית git](https://camo.githubusercontent.com/46b1d63d8c4a647bcfc34eef014232fce5125c03f0aa94b2a06d6765a2f1c6bb/68747470733a2f2f692e696d6775722e636f6d2f326c53573452452e706e67)

[**bat**](https://github.com/sharkdp/bat) הוא תחליף ל-cat מבוסס Rust עם הדגשת תחביר מובנית ואינטגרציית git. binary יחיד, חוצה-פלטפורמות, מתוחזק באופן פעיל.

**מאפיינים מבדלים עיקריים:** הדגשת תחביר ל-100+ שפות מונעת אובדן קונטקסט (context loss) כשסוכנים מתייחסים לקטעי קוד. אינטגרציית git מציגה שינויי שורות (מצב `--diff` משווה מול git index). מספרי שורות וגלישת עמודות ללא צורך ב-pager less. אינטגרציה עם הגדרות תחביר חיצוניות דרך תצורת DRY (Don't Repeat Yourself). ניתן להגדרה דרך משתנה סביבה `BAT_CONFIG_PATH` להתאמת ערכת נושא וסגנון. מכבד צבעי מערכת והעדפות ערכת נושא לאורך אמולטורי טרמינל.

**מתאים במיוחד ל:** מפתחים שבודקים קבצים במהלך תהליכי עבודה של סוכנים מבלי לשבור קונטקסט (lookups מהירים נשארים בטרמינל לעומת מעבר קונטקסט ל-IDE). מהנדסים שסוקרים שינויי git להבנת מה השתנה לפני עיבוד סוכן. משתמשים שמשלבים bat עם previewer של yazi או חלון preview של fzf לניווט קבצים עם הדגשת תחביר.

**פשרות:** מעט איטי יותר מ-cat רגיל בגלל עומס הדגשת תחביר (זניח לשימוש טיפוסי). דורש Nerd Font או גופן תואם לתמיכת אייקונים בכמה הגדרות טרמינל. מדגיש התחביר הוא דעתני - הגדרות שפה מותאמות דורשות תצורה במקום הרחבה מובנית.

**התקנה:**

```bash
# macOS
brew install bat

# Cargo (Rust)
cargo install bat

# Linux package managers
sudo apt install bat        # Debian/Ubuntu
sudo pacman -S bat         # Arch
```

## פעולות Git

### lazygit

![TUI של lazygit המציג תהליך עבודה של staging, committing ו-pushing](https://github.com/jesseduffield/lazygit/raw/assets/demo/commit_and_push-compressed.gif)

[**lazygit**](https://github.com/jesseduffield/lazygit) הוא TUI (ממשק משתמש טרמינלי) ל-Git מבוסס Go לניהול branches ויזואלי, staging אינטראקטיבי וניווט commits. חוצה-פלטפורמות עם אפשרויות התאמה אישית נרחבות.

**מאפיינים מבדלים עיקריים:** עץ branches ויזואלי מציג טופולוגיית מאגר ללא שינון פקודות. staging אינטראקטיבי תומך בבחירת hunks ו-staging של שורות בודדות. ניווט commits גולש בהיסטוריה עם diffs inline. keybindings ניתנים להתאמה דרך config YAML. תמיכת עכבר ללחיצה לבחירה, גלילה דרך commits. מודעות מרובת-worktrees לפיתוח branches מקביל.

**מתאים במיוחד ל:** מפתחים שמנהלים תהליכי עבודה מרובי-worktrees שצריכים קונטקסט branches ויזואלי. מהנדסים שעושים rebases אינטראקטיביים מורכבים, cherry-picks ו-merges. משתמשים שרוצים discoverability של git דרך ממשק מונחה-תפריטים במקום שינון פקודות.

**פשרות:** ביצועים נפגעים במאגרים מסיביים (Linux kernel: 57 שניות זמן טעינה, 2.6GB שימוש RAM). לא תחליף לכל פקודות git - כמה פעולות מהירות יותר דרך CLI גולמי. עקומת למידה ל-keybindings, אם כי ניתן לגילוי דרך תפריט עזרה מובנה.

**התקנה:**

```bash
# macOS
brew install lazygit

# Go
go install github.com/jesseduffield/lazygit@latest

# Windows
scoop install lazygit

# Linux package managers
sudo apt install lazygit     # Debian/Ubuntu
sudo pacman -S lazygit       # Arch
```

דרישות: git. אופציונלי: config מותאם ב-`~/.config/lazygit/config.yml`.

## ניווט קבצים

### eza

![רשימת תיקיות eza עם אייקונים, צבעים ומטא-נתוני קבצים](https://github.com/eza-community/eza/raw/main/docs/images/screenshots.png)

[**eza**](https://eza.rocks/) הוא תחליף ל-ls מבוסס Rust, fork מתוחזק באופן פעיל של פרויקט exa הלא-מתוחזק. מהיר, עשיר בתכונות, עם ברירות מחדל טובות יותר מ-ls מסורתי.

**מאפיינים מבדלים עיקריים:** צבעים לסוגי קבצים והרשאות כברירת מחדל. אינטגרציית git מציגה סטטוס לכל-קובץ (`--git`) או מצב מאגר לכל-תיקייה (`--git-repos`). גדלי קבצים קריאים-לאדם בפורמט long ללא flags. תצוגת עץ (`--tree`), תמיכת אייקונים (`--icons`) ותמיכת hyperlinks לאמולטורי טרמינל. מתקן Grid Bug מ-exa שגרם לבעיות rendering.

**מתאים במיוחד ל:** מפתחים שעובדים על פני git worktrees שצריכים נראות סטטוס branch מיידית. מהנדסים שרוצים ברירות מחדל טובות יותר ל-ls ללא עומס תצורה כבד. משתמשים נוחים עם מערכת אקולוגית של כלי Rust מודרניים ומוכנים להתקין תלויות נוספות.

**פשרות:** יותר תלויות מ-ls (binary Rust, Nerd Fonts אופציונלי לאייקונים). כמה תכונות דורשות תצורה (תמיכת אייקונים דורשת גופנים תואמים). עקומת למידה מעט ארוכה יותר לאפשרויות מתקדמות, אם כי ברירות מחדל עובדות טוב מיד.

**התקנה:**

```bash
# macOS
brew install eza

# Cargo (Rust)
cargo install eza

# Linux package managers
sudo apt install eza      # Debian/Ubuntu
sudo pacman -S eza        # Arch
```

### yazi

![מנהל קבצים טרמינלי yazi עם layout מרובה-panes ותצוגה מקדימה של קבצים](https://yazi-rs.github.io/webp/full-border.webp)

[**yazi**](https://yazi-rs.github.io/) הוא מנהל קבצים טרמינלי מבוסס Rust עם I/O אסינכרוני מלא והפצת משימות CPU מרובות-threads. כרגע בגרסת beta ציבורית, מתאים לשימוש יומיומי.

**מאפיינים מבדלים עיקריים:** ארכיטקטורה אסינכרונית מלאה שומרת על UI רספונסיבי במהלך פעולות כבדות (תיקיות גדולות, filesystems מרוחקים). תמיכת preview עשירה לתמונות (פרוטוקולי Kitty, Sixel, iTerm2, WezTerm), וידאו, PDFs, archives וקוד עם הדגשת תחביר דרך אינטגרציה מובנית. מערכת plugins מבוססת Lua עם מנהל חבילות להרחבה. keybindings בסגנון Vim עם מצב visual, תמיכה מרובת-tabs ו-auto-completion. ארכיטקטורת client-server עם מודל pub-sub מאפשרת תקשורת בין מופעים. משתלב עם ripgrep, fd, fzf ו-zoxide לתהליכי עבודה משופרים.

**מתאים במיוחד ל:** מפתחים שמנווטים מבני תיקיות מורכבים שצריכים previews קבצים עשירים מבלי לעזוב את הטרמינל. מהנדסים שעובדים עם filesystems מרוחקים שבהם רספונסיביות חשובה (I/O אסינכרוני מונע קפיאת UI). משתמשים שרוצים ניהול קבצים בסגנון Vim עם התאמה אישית נרחבת (plugins Lua, ערכות נושא, previewers מותאמים).

**פשרות:** כרגע בגרסת beta ציבורית - יציב מספיק לשימוש יומיומי אבל מתפתח במהירות. מורכב יותר מכלים פשוטים יותר כמו nnn (שהוא זעיר, כמעט אפס-config). עקומת למידה ל-keybindings של Vim אם מגיעים ממנהלי קבצים מסורתיים. חסר תכונת "undo" ש-Vifm מספק.

**התקנה:**

```bash
# macOS
brew install yazi

# Cargo (Rust)
cargo install --locked yazi-fm yazi-cli

# Linux package managers
sudo pacman -S yazi       # Arch
```

### fzf

![fzf fuzzy finder עם חלון preview המציג תוכן קבצים](https://raw.githubusercontent.com/junegunn/i/master/fzf-preview.png)

[**fzf**](https://junegunn.github.io/fzf/) הוא fuzzy finder מבוסס Go שמעבד מיליוני פריטים מיידית. binary יחיד, בוגר 11+ שנים (מאז 2013), מאומץ רחבות ככלי fuzzy CLI סטנדרטי.

**מאפיינים מבדלים עיקריים:** אינטגרציית shell מספקת Ctrl+R (חיפוש היסטוריה), Ctrl+T (חיפוש קבצים), Alt+C (ניווט תיקיות) ו-`**<TAB>` (fuzzy completion לכל פקודה). אינטגרציית Vim/Neovim דרך plugins של fzf.vim ו-fzf-lua. אינטגרציית tmux דרך wrapper של fzf-tmux לחלונות popup. תמיכת חלון preview מציגה תוכן קבצים או git diffs במהלך בחירה. ניתן להתאמה גבוהה דרך משתני סביבה (FZF_DEFAULT_OPTS, FZF_DEFAULT_COMMAND). ארכיטקטורה ידידותית-pipe עובדת עם כל פלט פקודה.

**מתאים במיוחד ל:** מפתחים שמנווטים בסיסי קוד גדולים שצריכים מיקום קובץ/symbol מיידי ללא מעברי קונטקסט ל-IDE. מהנדסים עם שימוש shell כבד לחיפוש היסטוריית פקודות ובחירת סקריפטים. משתמשים שרוצים בחירת fuzzy בכל מקום - git branches, docker containers, kubernetes pods, רשימות תהליכים.

**התקנה:**

```bash
# macOS
brew install fzf
$(brew --prefix)/opt/fzf/install  # Shell integration

# Git clone
git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
~/.fzf/install

# Linux package managers
sudo apt install fzf      # Debian/Ubuntu
sudo pacman -S fzf        # Arch
```

:::tip אינטגרציית Shell של fzf
עוצמה מלאה של fzf דורשת אינטגרציית shell. אחרי התקנה, הריצו:

```bash
$(brew --prefix)/opt/fzf/install  # macOS Homebrew
~/.fzf/install                     # Git installation
```

מאפשר: Ctrl+R (היסטוריה), Ctrl+T (קבצים), Alt+C (cd), `**<TAB>` (completion)
:::

### zoxide

![zoxide קופץ לתיקיות עם התאמת שם חלקית](https://github.com/ajeetdsouza/zoxide/raw/main/contrib/tutorial.webp)

[**zoxide**](https://github.com/ajeetdsouza/zoxide) הוא תחליף ל-cd מבוסס Rust שלומד דפוסי ניווט תיקיות. binary יחיד, אפס תלויות, תמיכה חוצת-פלטפורמות.

**מאפיינים מבדלים עיקריים:** אלגוריתם frecency (שקלול תדירות + עדכניות) לומד אוטומטית אילו תיקיות אתם מבקרים בהן הכי הרבה. קפיצה לכל תיקייה עם התאמת שם חלקית (`z proj` מנווט ל-`/path/to/project`). קיצורי דרך לתת-תיקיות עם `zi` לבחירה אינטראקטיבית. תחליף חלק ל-`cd` - alias drop-in ללא שינויי תהליך העבודה. אינטגרציה עם מנהלי קבצים (yazi, lf) ו-fzf לגילוי משופר. למידת paths מהירה מפחיתה זמן סריקת תיקיות ב-60-80% אחרי שדפוסי שימוש התחלתיים נקבעים.

**מתאים במיוחד ל:** מהנדסים שמנהלים worktrees או תיקיות פרויקטים מרובים שמבזבזים זמן על מעבר קונטקסט בין מיקומים. מפתחים עם מבני פרויקט עמוקים שבהם פקודות `cd` מרובות קורות באופן חוזר יומית. צוותים שמשתמשים ב-mono-repos או ארכיטקטורות microservices שבהם קפיצה בין תיקיות services תכופה.

**פשרות:** שלב למידה נדרש - אלגוריתם frecency לוקח ימים להתייצב כש-zoxide בונה סטטיסטיקות paths. התאמת שם חלקית יכולה מדי פעם להתממש לתיקיות לא צפויות אם paths מרובים מתאימים (מצב אינטראקטיבי `zi` מקל). דורש תצורת shell להחלפת `cd` לחלוטין (הוספת alias היא טריוויאלית, אבל לא אוטומטית). דורש ללמוד שמות פקודות חדשים (אם כי `z` הופך לזיכרון שרירים מהר).

**התקנה:**

```bash
# macOS
brew install zoxide

# Cargo (Rust)
cargo install zoxide

# Linux package managers
sudo apt install zoxide       # Debian/Ubuntu
sudo pacman -S zoxide        # Arch
```

דרישות: הוסיפו ל-config shell (`~/.bashrc`, `~/.zshrc`, `~/.config/fish/config.fish`): `eval "$(zoxide init bash)"` או שווה ערך ל-shell שלכם. אופציונלי: fzf לבחירה אינטראקטיבית `zi`.

## ניהול סשנים

**קריטי לתהליכי עבודה מקבילים של סוכנים:** הרצת 4-6 מופעי Claude Code בו-זמנית דורשת terminal multiplexing. סעיף זה מכסה את הכלים שמאפשרים פיתוח מרובה סוכנים. דרישה מוקדמת: נוחות עם כלי ניווט הקבצים למעלה.

### tmux

![tmux עם שני panes מפוצלים שמריצים סשני טרמינל שונים](https://hamvocke.com/_astro/tmux_split.b845PJCE_Z2bALRv.webp)

[**tmux**](https://github.com/tmux/tmux) הוא terminal multiplexer (מרבב טרמינלים) מבוסס C שמאפשר persistence של סשנים, פיצול חלונות וביצוע panes מקביל על שרתים מקומיים ומרוחקים. מבוסס ומוכח (battle-tested) לשימוש production מאז 2007, מומלץ לשרתים מרוחקים ותהליכי עבודה קריטיים שבהן ניתוקי טרמינל לא מקובלים.

**מאפיינים מבדלים עיקריים:** סשנים ניתנים לניתוק שורדים ניתוקי SSH - התנתקו מכל מקום, התחברו מחדש מכל מקום, עם מצב מלא נשמר. ארכיטקטורת server-client שומרת על סשנים רצים בצד השרת גם אחרי יציאת client. פיצול panes (אופקי/אנכי) מריץ סוכנים מרובים זה-לצד-זה בחלון בודד ללא מעבר קונטקסט. ניהול חלונות מארגן תהליכי עבודה ל-tabs, כל אחד עם layouts panes עצמאיים. תצורה ניתנת לסקריפט דרך ~/.tmux.conf מאפשרת keybindings persistent וניהול plugins. plugin tmux-resurrect שומר סשנים לאורך reboot מערכת - הפעילו מחדש את המחשב, הריצו `tmux-resurrect restore`, ו-worktrees + מצב עורך משוחזרים במלואם. keybindings בסגנון Vim (עם התאמה אישית) משתלבים באופן טבעי בתהליכי עבודה של vim/nvim.

**מתאים במיוחד ל:** מפתחים שמריצים 4-6 מופעי Claude Code בו-זמנית - השתמשו בחלונות מרובים (אחד לכל git worktree) או panes מפוצלים (סוכנים זה לצד זה) בהתאם לתהליך העבודה. מהנדסים שעובדים על שרתים מרוחקים שבהם ניתוקי SSH תכופים ואובדן סשן לא מקובל. צוותי DevOps/SRE שמנטרים תהליכים ארוכי-טווח שחייבים לשרוד הפרעות רשת. משתמשים שמשלבים עורכי טרמינל (vim, micro) עם tmux לפיתוח מונחה-מקלדת לחלוטין ללא IDE.

**פשרות:** עקומת למידה התחלתית תלולה - ניווט panes, ניהול חלונות והמודל המנטלי של סשנים דורשים 1-2 שבועות עד שזה נכנס. מורכבות תצורה יכולה להסלים (plugins, keybindings, ניהול ערכות נושא) אם לא ממושמעים לגבי מינימליזם. debugging של מצב pane/session דורש הבנת ארכיטקטורת server; מצב "תקוע" לפעמים דורש הריגת server ואובדן סשנים.

**לעומת tabs של אמולטור טרמינל:** tabs של טרמינל נמצאים בצד ה-client ומתים בניתוק. סשני tmux נשארים בצד השרת ללא הגבלת זמן - reboots, כשל רשת או שינה של לפטופ לא הורגים את העבודה שלכם. פשרה: tmux מוסיף עומס קוגניטיבי; tabs הם מודל מנטלי פשוט יותר לתהליכי עבודה של מכונה יחידה.

**לעומת Zellij:** חדש יותר, עקומת למידה ידידותית יותר, keybindings ברירת מחדל טובים יותר וליטוש UI. tmux מחליף קצת ליטוש UX על 15+ שנים של ניסיון מוכח בשטח, footprint קטן יותר ונפוצות בשרתים מרוחקים שבהם אי אפשר להתקין Zellij.

**התקנה:**

```bash
# macOS
brew install tmux

# Linux
sudo apt install tmux       # Debian/Ubuntu
sudo pacman -S tmux        # Arch
sudo yum install tmux      # RedHat/CentOS

# Build from source
git clone https://github.com/tmux/tmux.git
cd tmux
sh autogen.sh && ./configure && make
sudo make install
```

דרישות: libevent ו-ncurses (מותקנים מראש ברוב המערכות). אופציונלי: plugin tmux-resurrect ל-persistence סשנים (`git clone https://github.com/tmux-plugins/tmux-resurrect ~/.tmux/plugins/tmux-resurrect`). אופציונלי: tpm (Tmux Plugin Manager) לניהול plugins דרך config.

### Zellij

![workspace של Zellij בטרמינל עם panes מרובים וחלונות צפים](https://raw.githubusercontent.com/zellij-org/zellij/main/assets/demo.gif)

[**Zellij**](https://zellij.dev/) הוא terminal multiplexer מבוסס Rust עם UI מודרני, ברירות מחדל עשירות שעובדות מהקופסה (batteries-included) ומערכת plugins של WASM. פיתוח פעיל, מתאים לשימוש יומיומי אבל מתפתח במהירות. שקלו tmux לשרתים מרוחקים או תהליכי עבודה קריטיים-למשימה.

**מאפיינים מבדלים עיקריים:** מערכת layouts עם סידורי preset מובנים (tiled, floating, stacked) - פרודוקטיביות מיידית ללא תצורה. auto-tabbing מאפשר פיצול panes ללא ניהול חלונות מפורש. מערכת plugins מבוססת WASM מאפשרת plugins בכל שפה (Rust, JavaScript, Python דרך binding). UI מספק mode ויזואלי/תפריט מקשים - גלו תכונות ללא שינון. keybindings ברירת מחדל טובים יותר (ניווט ctrl+arrow אינטואיטיבי) בהשוואה למערכת prefix של tmux. buffer scrollback עם חיפוש מובנה ב-UI. תמיכת עכבר לבחירת panes, שינוי גודל וגלילה.

**מתאים במיוחד ל:** מפתחים שמשתמשים ב-Zellij בעיקר לפיתוח מקומי על מכונות יחידות. מהנדסים שרוצים ברירות מחדל מודרניות ללא תצורה נרחבת (בסגנון tmux) להשגת פונקציונליות בסיסית. תהליכי עבודה מרובי סוכנים שדורשים מעבר קונטקסט תכוף בין משימות מקבילות בתוך מערכת יחידה. משתמשים נוחים עם כלים מתפתחים ומוכנים להסתגל לשינויי keybindings כשהפרויקט מתבגר.

**פשרות:** keybindings עדיין מתפתחים - עדכונים עשויים לשבור זיכרון שרירים מבוסס. תמיכת שרתים מרוחקים ניסיונית; persistence סשני ssh לא מבוסס ומוכח (battle-tested) כמו tmux. מערכת אקולוגית של plugins קטנה משמעותית מ-tmux - פחות הרחבות למשתמשי power זמינות. לא מומלץ לעבודה מרוחקת ב-production או סשני SSH ארוכי-טווח שבהם יציבות tmux חיונית. תצורה דורשת למידת YAML/KDL במקום גישת הסקריפטינג של tmux.

**לעומת tmux:** ברירות מחדל טובות יותר ועקומת למידה לתהליכי עבודה של פיתוח מקומי. Zellij מעדיף נגישות; tmux מתגמל השקעת תצורה עמוקה. פשרה: Zellij פחות יציב לעבודה מרוחקת, מערכת אקולוגית plugins קטנה יותר, keybindings עדיין מתפתחים.

**לעומת splits של אמולטור טרמינל מסורתי (iTerm2, WezTerm):** splits native לטרמינל לא נשמרים לאורך SSH - רק multiplexers (tmux, Zellij) מאפשרים סשנים ניתנים לניתוק. splits של טרמינל חיים ב-GUI; סשני multiplexer חיים על השרת/מכונה.

**התקנה:**

```bash
# macOS
brew install zellij

# Cargo (Rust)
cargo install zellij

# Linux package managers
sudo pacman -S zellij       # Arch
# Others: check https://zellij.dev/documentation/installation
```

## אוטומציית דפדפן

### agent-browser

[**agent-browser**](https://agent-browser.dev/) הוא CLI מבוסס Rust לאוטומציית דפדפן שתוכנן במיוחד לסוכני AI. binary native, תמיכה חוצת-פלטפורמות, עובד עם כל סוכן שמריץ פקודות shell.

**מאפיינים מבדלים עיקריים:** מערכת עץ נגישות מבוססת-ref מחזירה snapshots קומפקטיים עם references אלמנטים דטרמיניסטיים (`@e1`, `@e2`) - סוכנים לוחצים לפי ref במקום CSS selectors שבירים או XPath. פלט יעיל בטוקנים (200-400 טוקנים ל-snapshot לעומת 5,000-15,000 ל-DOM מלא) שומר על ה-context window של הסוכן. מעל 50 פקודות מכסות ניווט, forms, screenshots, בדיקת רשת ואחסון. תמיכת sessions מאפשרת מופעי דפדפן מבודדים מרובים עם מצבי אימות נפרדים. CLI native ב-Rust מספק פרסור פקודות מיידי ללא עומס runtime של Node.js או Python.

**מתאים במיוחד ל:** תהליכי עבודה בסיוע-AI שבהן סוכנים צריכים לתקשר עם UI אינטרנט - בדיקת שינויים בדפדפן, מילוי forms, שליפת נתונים, אימות deployments. מהנדסים שמשתמשים בסוכנים מבוססי CLI (Claude Code, Cursor, Copilot) שצריכים אוטומציית דפדפן ללא הגדרת שרת MCP. מפתחים שרוצים בחירת אלמנטים דטרמיניסטית על פני פרסור ויזואלי מבוסס-screenshot או אסטרטגיות selector שבירות.

**פשרות:** בחירה מבוססת-ref דורשת snapshot לפני אינטראקציה (מינימום שתי פקודות). מסתמך על עץ נגישות, שעשוי לפספס תוכן שמורנדר דינמית ללא ARIA attributes מתאימים - ודאו שלאפליקציות יעד יש markup סמנטי.

**דוגמת תהליך עבודה:**

```bash
agent-browser open example.com
agent-browser snapshot -i        # Returns refs: [ref=@e1] "Example Domain", [ref=@e2] "More information..."
agent-browser click @e2          # Click by ref—deterministic, no selector fragility
agent-browser screenshot page.png
agent-browser close
```

**התקנה:**

```bash
# npm (recommended)
npm install -g agent-browser

# Verify installation
agent-browser --version
```

דרישות: Node.js 18+ להתקנת npm. דפדפן מבוסס Chromium (מצורף או Chrome מערכת).

:::tip למה אוטומציה מבוססת-Ref מנצחת
הגישה מבוססת-ref של agent-browser (`@e1`, `@e2`) מייצרת בחירת אלמנטים דטרמיניסטית שעולה על אלטרנטיבות מבוססות-selector. ה-snapshot של עץ הנגישות לוכד מבנה סמנטי, לא layout ויזואלי - סוכנים מבינים מה אלמנטים *הם* ולא איפה הם מופיעים על המסך. זה מוביל לאוטומציה אמינה יותר ששורדת שינויי UI.
:::

---

**תוכן קורס קשור:**

- [שיעור 7: תכנון וביצוע](/docs/practical-techniques/lesson-7-planning-execution) - תהליכי עבודה מרובי-worktree שממנפות כלי CLI אלה
- [כלי מפתח: טרמינלים](/developer-tools/terminals) - המלצות טרמינל להרצת כלי CLI אלה ביעילות
- [כלי מפתח: שרתי MCP](/developer-tools/mcp-servers) - הרחיבו סוכני CLI עם מחקר קוד והארקה באינטרנט
