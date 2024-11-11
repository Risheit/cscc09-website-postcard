export default function Page({ params }: { params: { userid: string } }) {
  // TODO NOTE TO SELF: DO NOT FORGET TO VALIDATE THE ID
  return <div>User ID: {params.userid}</div>;
}
