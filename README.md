# Daily Catholic Readings - React Native

A React Native application that provides daily Catholic readings, saint information, and homilies in multiple languages.

## Features

- Daily Catholic readings (First Reading, Responsorial Psalm, Gospel)
- Saint of the day with biography
- AI-generated homilies based on the readings
- Multi-language support (English, Spanish, Italian, German)
- Beautiful dark theme UI
- Collapsible reading sections
- Loading states and error handling

## Setup

### Prerequisites

- Node.js (>= 18)
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. For iOS, install CocoaPods dependencies:
   ```bash
   cd ios && pod install && cd ..
   ```

### Running the App

#### Android
```bash
npm run android
```

#### iOS
```bash
npm run ios
```

#### Start Metro Bundler
```bash
npm start
```

## Architecture

The app maintains the same architecture as the original web version:

- **Services**: API calls to Universalis and Gemini AI
- **Components**: Reusable UI components adapted for React Native
- **State Management**: React hooks for state management
- **Styling**: StyleSheet API with dark theme

## Key Differences from Web Version

1. **Navigation**: Uses React Native navigation components
2. **Styling**: CSS replaced with StyleSheet API
3. **Icons**: Uses react-native-vector-icons instead of Lucide
4. **Toasts**: Uses react-native-toast-message
5. **Collapsible**: Uses react-native-collapsible for accordion functionality
6. **Picker**: Uses react-native-picker-select for language selection

## API Integration

The app integrates with:
- **Universalis API**: For daily Catholic readings
- **Gemini AI**: For content translation and homily generation

Note: The JSONP implementation has been adapted for React Native's fetch API.

## Customization

The app supports easy customization of:
- Color themes (modify StyleSheet colors)
- Languages (add new language options)
- API endpoints (modify service configurations)

## Building for Production

### Android
```bash
cd android && ./gradlew assembleRelease
```

### iOS
Build through Xcode or use Fastlane for automated builds.