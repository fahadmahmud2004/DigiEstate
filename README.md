```markdown
# DigiHomeHub

DigiHomeHub is a comprehensive real estate marketplace web application designed by DigiEstate Venture Limited. It connects property buyers, sellers, and renters on a secure, user-friendly platform. The application supports property listings, bookings, payments, and communication between parties while providing robust administrative oversight.

## Overview

DigiHomeHub is built with a modern web stack, comprising a frontend built with ReactJS using Vite and integrated with shadcn-ui component library and Tailwind CSS framework, and a backend built with ExpressJS and MongoDB for database support. The application leverages Supabase for authentication and storage services and integrates with third-party technologies such as Google Maps API for map functionalities and email services for communication. 

The codebase is structured as follows:

**Frontend (client/):**
- ReactJS with Vite devserver
- Tailwind CSS for styling
- Client-side routing with `react-router-dom`
- Integrated shadcn-ui component library
- Port: 5173

**Backend (server/):**
- ExpressJS server implementing REST API endpoints
- MongoDB with Mongoose for database operations
- Token-based authentication with JWT
- Port: 3001

Concurrently is configured to run both the client and server together.

## Features

DigiHomeHub offers a rich set of features including:

### User Experience & Interface Flow
- **Landing & Authentication Experience**
  - Clean, modern landing page with a search bar and quick filters for properties.
  - Simple user registration, email verification, and social login options.
- **User Profile Management**
  - Set up personal information, upload profile pictures, and manage account settings.
- **Property Listing Experience**
  - Step-by-step listing creation wizard with dynamic form fields and multimedia uploads.
  - Listing management dashboard for users to view and edit their listings.
- **Property Discovery & Search**
  - Advanced filters, sorting options, and save search functionality.
- **Property Details Page**
  - High-quality image gallery, detailed property information, and contact seller options.
- **Booking & Transaction Flow**
  - Streamlined booking process and payment handling with various methods.
- **Communication System**
  - Chat interface for buyer and seller communications post-booking.
- **Review & Rating System**
  - User can provide ratings and reviews post-transaction.
- **Complaint & Appeals System**
  - Complaint forms, tracking dashboards, and an appeals process.
- **Administrative Interface**
  - Admin dashboard for managing users, listings, complaints, and reviews.
- **Notification System**
  - Real-time notifications for various user activities and system updates.

## Getting started

### Requirements

To run the DigiHomeHub project, ensure you have the following installed on your machine:
- Node.js (v14.x or later)
- npm (v6.x or later)
- MongoDB

### Quickstart

Follow these steps to get the DigiHomeHub project up and running:

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/DigiHomeHub.git
    cd DigiHomeHub
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Configure the environment variables:
    Create a `.env` file in the `server/` directory with the following content:
    ```sh
    PORT=3001
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    ```

4. Start the application:
    ```sh
    npm run start
    ```

5. Access the frontend at `http://localhost:5173` and the backend API endpoints at `http://localhost:3001`.

### License

The project is proprietary (not open source). 

```
© 2024 DigiEstate Venture Limited. All rights reserved.
```