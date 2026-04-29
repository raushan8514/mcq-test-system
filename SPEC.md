# MCQ Test System - Specification Document

## 1. Project Overview

**Project Name:** MCQ Test System  
**Project Type:** Full-stack Web Application  
**Core Functionality:** A multi-role (student/teacher) MCQ examination platform with Firebase Authentication and Firestore database  
**Target Users:** Teachers (exam creators) and Students (test takers)

---

## 2. UI/UX Specification

### Layout Structure

**Pages:**
1. Login/Signup Page (index.html)
2. Teacher Dashboard (teacher.html)
3. Student Dashboard (student.html)
4. Test Page (test.html)

**Common Layout:**
- Fixed navbar with logo, user info, logout button
- Main content area with max-width 1200px, centered
- Footer with copyright

**Responsive Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Visual Design

**Color Palette:**
- Primary: `#1a1a2e` (Deep Navy)
- Secondary: `#16213e` (Dark Blue)
- Accent: `#e94560` (Coral Red)
- Success: `#00d9a5` (Mint Green)
- Warning: `#ffc107` (Amber)
- Error: `#ff4757` (Red)
- Background: `#0f0f1a` (Near Black)
- Surface: `#1f1f3a` (Dark Purple)
- Text Primary: `#ffffff`
- Text Secondary: `#a0a0b0`
- Border: `#2d2d4a`

**Typography:**
- Headings: 'Poppins', sans-serif (600 weight)
- Body: 'Inter', sans-serif (400 weight)
- Font Sizes:
  - H1: 2.5rem
  - H2: 2rem
  - H3: 1.5rem
  - Body: 1rem
  - Small: 0.875rem

**Spacing System:**
- Base unit: 8px
- Margins: 8px, 16px, 24px, 32px, 48px
- Paddings: 8px, 16px, 24px, 32px

**Visual Effects:**
- Card shadows: `0 4px 20px rgba(0, 0, 0, 0.3)`
- Hover transitions: 0.3s ease
- Button hover: scale(1.02) + glow effect
- Input focus: border-color change to accent

### Components

**Buttons:**
- Primary: Accent background, white text, rounded 8px
- Secondary: Transparent, accent border, accent text
- Danger: Error background, white text
- States: hover (lighten 10%), active (darken 5%), disabled (opacity 0.5)

**Input Fields:**
- Background: Surface color
- Border: 1px solid Border color
- Border radius: 8px
- Padding: 12px 16px
- Focus: Accent border + subtle glow

**Cards:**
- Background: Surface color
- Border radius: 12px
- Padding: 24px
- Shadow: Card shadow

**Tables:**
- Striped rows (alternating surface/background)
- Hover highlight
- Sortable headers

**Modals:**
- Centered overlay
- Dark backdrop (rgba(0,0,0,0.7))
- Slide-in animation

---

## 3. Functionality Specification

### Authentication System

**Signup:**
- Fields: Name, Email, Password, Confirm Password, Role (Student/Teacher)
- Validation: Email format, password min 6 chars, passwords match
- Auto-login after signup

**Login:**
- Fields: Email, Password
- Remember me option
- Error messages for invalid credentials

**Logout:**
- Clear session
- Redirect to login page

### Teacher Dashboard

**Question Management:**
- Add new question:
  - Question text (required)
  - 4 options (A, B, C, D) - all required
  - Correct answer selection
  - Category/Subject tag
- Edit existing question
- Delete question (with confirmation)
- Search/filter questions

**Student Submissions:**
- View all submissions table
- Columns: Student Name, Email, Score, Date, Action
- View detailed results (questions attempted, correct answers)
- Calculate percentage score

**Statistics:**
- Total questions count
- Total students count
- Total submissions count
- Average score

### Student Dashboard

**Test Interface:**
- Display questions one at a time or all at once (toggle)
- Navigation: Previous, Next, Submit
- Timer display (optional)
- Progress indicator (Question X of Y)

**Answer Submission:**
- Select radio button for answer
- Can change answer before submit
- Confirmation before final submit
- Store answers in Firestore

**Results:**
- Do NOT show score after submission
- Show confirmation message
- Teacher reviews and grades

### Database Schema

**Users Collection:**
```
users/
  {userId}/
    - name: string
    - email: string
    - role: "student" | "teacher"
    - createdAt: timestamp
```

**Questions Collection:**
```
questions/
  {questionId}/
    - questionText: string
    - optionA: string
    - optionB: string
    - optionC: string
    - optionD: string
    - correctAnswer: "A" | "B" | "C" | "D"
    - category: string
    - createdBy: userId
    - createdAt: timestamp
```

**Results Collection:**
```
results/
  {resultId}/
    - studentId: string
    - studentName: string
    - studentEmail: string
    - answers: map { questionId: "A"|"B"|"C"|"D" }
    - score: number (null until graded)
    - totalQuestions: number
    - submittedAt: timestamp
    - gradedBy: userId (teacher)
    - gradedAt: timestamp
```

---

## 4. File Structure

```
/qusez/
├── index.html          # Login/Signup page
├── teacher.html        # Teacher dashboard
├── student.html        # Student dashboard
├── test.html           # Test taking page
├── css/
│   └── style.css       # All styles
├── js/
│   ├── auth.js         # Authentication logic
│   ├── teacher.js      # Teacher dashboard logic
│   ├── student.js      # Student dashboard logic
│   └── test.js         # Test taking logic
└── firebase-config.js  # Firebase configuration
```

---

## 5. Acceptance Criteria

### Authentication
- [ ] User can sign up with name, email, password, role
- [ ] User can login with email/password
- [ ] Invalid credentials show error message
- [ ] Logout clears session and redirects

### Teacher Features
- [ ] Can add new MCQ question with all fields
- [ ] Can edit existing question
- [ ] Can delete question with confirmation
- [ ] Can view all student submissions
- [ ] Can see scores calculated

### Student Features
- [ ] Can view available questions
- [ ] Can select answers for each question
- [ ] Can navigate between questions
- [ ] Can submit test
- [ ] Score NOT shown after submission

### Database
- [ ] Users stored in Firestore
- [ ] Questions stored with all fields
- [ ] Results stored with answers map
- [ ] Data persists across sessions

### UI/UX
- [ ] Dark theme applied consistently
- [ ] Responsive on mobile/tablet/desktop
- [ ] Smooth transitions and animations
- [ ] Loading states for async operations