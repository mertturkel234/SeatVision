import { TicketClient } from "./ticket-client";

export function generateStaticParams() {
  return [{ orderId: "demo" }];
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <TicketClient orderId={orderId} />;
}
