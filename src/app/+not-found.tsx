import { router } from "expo-router";
import { Button, Empty, Screen } from "@/components/ui";

export default function NotFound() {
  return (
    <Screen padTop={false}>
      <Empty emoji="🧭" title="Ih, se perdeu, sô?">Essa tela não existe.</Empty>
      <Button onPress={() => router.replace("/")}>Voltar pro início</Button>
    </Screen>
  );
}
