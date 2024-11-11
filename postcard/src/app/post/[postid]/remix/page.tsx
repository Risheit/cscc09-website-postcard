export default function Page({ params }: { params: { postid: string } }) {
  // TODO NOTE TO SELF: DO NOT FORGET TO VALIDATE THE ID
  return <div>Remix: {params.postid}</div>;
}
