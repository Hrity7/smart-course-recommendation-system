# Smart Course Recommendation System

An AI-powered platform for personalized course recommendations and skill-based learning paths.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://smart-course-recommendation-system-jbp5.onrender.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/Hrity7/smart-course-recommendation-system)

## Live Demo

**Try the application:** https://smart-course-recommendation-system-jbp5.onrender.com/

*Note: The free hosting service may take a little time to start after a period of inactivity.*

## Screenshots

## Screenshots

### Homepage
![Homepage](screenshots/overview.png)

### Course Recommendations
![Recommendations](screenshots/foryou.png)

### YouTube Courses
![AI Advisor](screenshots/youtubecourses.png)

### Learning
![AI Advisor](screenshots/learning.png)

### Road Map
![AI Advisor](screenshots/roadmap.png)

### Skill Gaps
![AI Advisor](screenshots/skillgaps.png)

### Analytics
![AI Advisor](screenshots/analytics.png)

### Settings
![AI Advisor](screenshots/settings.png)

### Disclaimer
![AI Advisor](screenshots/disclaimer.png)


## Features

- **Personalized Recommendations** – Suggests courses based on users' interests and skills.
- **Learning Paths** – Helps users identify skills and plan their learning journey.
- **AI Advisor** – Provides AI-powered learning guidance.
- **YouTube Integration** – Provides access to relevant learning videos and courses.
- **Interactive Interface** – Simple and user-friendly design.

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend |
| TypeScript | Application development |
| Node.js | Backend runtime |
| Express.js | Backend framework |
| Gemini API | AI-powered assistance |
| YouTube API | Learning video integration |
| Python | Separate desktop application |


## System Architecture

The following diagram illustrates the interaction between
the frontend, backend, recommendation logic, and external APIs.


flowchart TD
    A[User] --> B[React + TypeScript Frontend]
    B --> C[Node.js + Express Backend]
    C --> D[Recommendation Logic]
    C --> E[Gemini API]
    C --> F[YouTube Data API]
    D --> G[Personalized Course Recommendations]
    E --> H[AI Learning Assistance]
    F --> I[YouTube Learning Resources]
    G --> J[User Interface]
    H --> J
    I --> J



## Run Locally

### Prerequisites
- Node.js and npm
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Hrity7/smart-course-recommendation-system.git
   ```

2. Open the project folder:

   ```bash
   cd smart-course-recommendation-system
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the project root and add your API keys:

   ```env
   GEMINI_API_KEY=your_gemini_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the local URL displayed in your terminal.

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | API key for Gemini AI |
| `YOUTUBE_API_KEY` | API key for YouTube Data API |

**Important:** Never upload your actual API keys or `.env` file to GitHub.

## Team Members

This project was developed collaboratively by:

| Name | Responsibility |
|---|---|
| Hritwiz Verma | UI Designer |
| Faiz Hussain | Java Developer |
| Krish Dubey | Testing Member |
| Ishaan Singh | Documentation Incharge |
| Manish Chauhan | Team Leader |

## Project Objective

The objective of this project is to simplify the process of finding suitable learning resources by using AI-based recommendations and personalized learning guidance.

## Contributing

This is a collaborative academic project. Contributions, suggestions, and improvements are welcome.

## License

This project is developed for educational purposes.
