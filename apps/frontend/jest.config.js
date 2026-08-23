// Jest config for the Expo SDK 54 app. Uses the jest-expo preset, which
// configures the React Native transform, module mapping, and file
// extensions (including recognizing *-test.ts(x) as test files) to match
// what Expo/React Native actually ships. See:
// https://docs.expo.dev/develop/unit-testing/
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)",
  ],
};
