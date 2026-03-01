// app/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
  // This will always show loading first
  return <Redirect href="/loading" />;
}