import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function About() {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="pie-chart" size={60} color="#2e7d32" />
        </View>
        
        <Text style={styles.appName}>Investments Wallet</Text>
        <Text style={styles.version}>Versão 1.0.0</Text>

        <Text style={styles.description}>
          Uma carteira de investimentos inteligente pensada para investidores que desejam 
          total controle sobre seus ativos de renda variável.
        </Text>

        <View style={styles.featuresContainer}>
          <FeatureItem icon="bar-chart-outline" text="Acompanhe sua rentabilidade" />
          <FeatureItem icon="lock-closed-outline" text="Dados salvos localmente" />
          <FeatureItem icon="trending-up-outline" text="Cotações em tempo real" />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Desenvolvido por Rafael Toledo e Pedro Silveira</Text>
        <Text style={styles.footerText}>Trabalho final 2025</Text>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={20} color="#555" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'space-between' },
  contentContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  iconContainer: { 
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#e8f5e9', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20 
  },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#121212', marginBottom: 5 },
  version: { fontSize: 14, color: '#888', marginBottom: 25 },
  description: { 
    textAlign: 'center', fontSize: 16, color: '#555', lineHeight: 24, marginBottom: 40 
  },
  featuresContainer: { 
    marginTop: 10 
  },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  featureText: { marginLeft: 15, fontSize: 15, color: '#444' },
  footer: { padding: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  footerText: { fontSize: 12, color: '#999', marginTop: 2 }
});