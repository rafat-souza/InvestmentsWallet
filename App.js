import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';

import { WalletProvider } from './src/WalletContext.js';
import AppNavigator from './src/Navigator.js';

export default function App() {
  return (
    <WalletProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </WalletProvider>
  );
}