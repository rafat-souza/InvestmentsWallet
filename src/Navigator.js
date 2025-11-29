import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Dashboard from './Screens/Dashboard';
import Positions from './Screens/Positions';
import Transaction from './Screens/Transactions';
import Settings from './Screens/Settings';
import About from './Screens/About';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'pie-chart';
          else if (route.name === 'Posições') iconName = 'list';
          else if (route.name === 'Cadastrar') iconName = 'add-circle';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2e7d32', 
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Posições" component={Positions} />
      <Tab.Screen name="Cadastrar" component={Transaction} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Drawer.Navigator screenOptions={{ 
      headerTintColor: '#2e7d32',
      drawerActiveTintColor: '#2e7d32' 
    }}>
      <Drawer.Screen 
        name="Início" 
        component={HomeTabs} 
        options={{ title: 'Minha Carteira' }}
      />
      <Drawer.Screen name="Configurações" component={Settings} />
      <Drawer.Screen name="Sobre" component={About} />
    </Drawer.Navigator>
  );
}