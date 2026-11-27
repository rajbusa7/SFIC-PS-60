import MeetingRoomPage from "../../../../meetings/room/[roomId]/page";

export default async function PtmLobbyPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await params;
  return <MeetingRoomPage params={{ roomId: resolved.id }} />;
}
