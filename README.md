# UB FormFlow (SPP7)

UB FormFlow is a web application that allows students of the University of Belize to conveniently submit forms online, keep track of form deadlines, generate form submission receipts, and view a comprehensive history of their submitted forms. It serves to enhance the transparency and efficiency of the form submission process for both students and university staff.

The CodeCraft Solutions team that developed this application consists of [Andres Hung](https://github.com/andreshungbz), [Jennessa Sierra](https://github.com/jennxsierra), and [Tysha Daniels](https://github.com/aoideee).

This repository contains the source code for the high-fidelity prototype, whose design was iterated on over the course of the 2025-1 semester for the CMPS3141 Human Computer Interface course. It implements the three main tasks:

1. Simple Task - Find out which forms I need to fill out soon.
2. Intermediate Task - Get confirmation and proof that I submitted my form.
3. Complex Task - See the progress of my ongoing forms.

## Portfolio Website & Hi-Fi Prototype

The entire design process of the overall project can be found in documents and presentations at the [UB FormFlow SPP3 Portfolio Website](https://jennxsierra.github.io/ub-formflow/).

The high-fidelity prototype, externally hosted on Vercel, can be accessed online at [UB FormFlow Hi-Fi Prototype](https://ub-formflow-hifi.vercel.app/). See the [Operating Instructions section](#operating-instructions) for test account credentials.

## Installation Requirements

The prototype can already be accessed and used for user testing online, but the application can be run locally by following the instructions below. The only prerequisite is to have [Node.js](https://nodejs.org/en/download/) installed on your machine.

1. Clone this repository and enter the project directory:

```
git clone https://github.com/andreshungbz/ub-formflow-hifi.git && cd ub-formflow-hifi
```

2. Install the required dependencies:

```
npm install
```

3. Start the development server:

```
npm run dev
```

4. Open your web browser and navigate to `http://localhost:3000` to access the application.

## Operating Instructions

Use the test account credentials provided below to log in and explore the application features. Logging is required to submit forms and view the form history. Some forms may already exist in the form history for testing purposes.

| Email                | Password |
| -------------------- | -------- |
| 2023158285@ub.edu.bz | password |

## Implementation Limitations

While the high-fidelity prototype addressed many of the usability issues discovered in the medium-fidelity prototype through heuristic evaluation, the following limitations still exist:

- The forgot password functionality is not implemented.
- Students cannot edit or delete submitted forms.
- The PDF receipt generated contains only the most basic information.
- Dasboards for the universtiy staff and faclulty perspective are not fully fleshed out.
