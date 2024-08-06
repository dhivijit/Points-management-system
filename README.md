# Points Management System

The Points Management System is created for the Forensic Analysis Club & Triage (FACT) to manage points during an event called **Riddle Realm** at the techfest **Tantrotsav** hosted by **Amrita Vishwa Vidyapeetham**. This system is built using ExpressJS for the HTTP server, EJS for rendering dynamic content, and MongoDB for data storage.

## Features

- **User Registration**: Allows users (e.g., evaluators) and participants (event attendees) to register.
- **Security Measures**: Implements security features to prevent users from awarding points to a team multiple times, ensuring fair play.
- **Logging**: Logs all activities, which can only be accessed by the administrator.
- **Token Management**: Issues tokens upon user login and removes them upon logout to track the number of logins, preventing misuse of stolen credentials.

## Technologies Used

- **ExpressJS**: For building the HTTP server.
- **EJS**: For dynamic content rendering.
- **MongoDB**: For data storage.

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/dhivijit/Points-management-system.git
    ```
2. Navigate to the project directory:
    ```bash
    cd Points-management-system
    ```
3. Install the dependencies:
    ```bash
    npm install
    ```
4. Configure the environment variables:
    - Create a `.env` file in the root directory.
    - Add the following configuration to the `.env` file:
    ```env
    PORT=YOUR_PORT_NUMBER
    MONGO_URL=YOUR_MONGODB_URL
    DB_NAME=YOUR_DATABASE_NAME
    PARTICIPANTS_db=YOUR_PARTICIPANTS_COLLECTION
    USERS_db=YOUR_USERS_COLLECTION
    TOKENS_db=YOUR_TOKENS_COLLECTION
    LOGS_db=YOUR_LOGS_COLLECTION
    ```

## Usage

1. Start the server:
    ```bash
    npm start
    ```
2. Open your browser and go to:
    ```
    http://localhost:<Port number set in env file>
    ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

Special thanks to the Forensic Analysis Club & Triage (FACT) for their support and collaboration in this project.

---

Feel free to reach out if you have any questions or need further assistance!
