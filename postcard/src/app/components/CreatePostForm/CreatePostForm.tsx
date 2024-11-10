export default function CreatePostForm(props: {
  formData: any;
  setFormData: any;
}) {
  const { formData, setFormData } = props;

  return (
    <div id="create-post-form" className="grid grid-cols-1 gap-4 mb-4">
      <label className="flex flex-col">
        <span className="font-semibold mb-1">Location:</span>
        <input
          className="p-2 bg-background-50 border border-text-500 rounded"
          placeholder="Enter location..."
          value={formData.location || ""}
          onChange={(ev) => {
            setFormData({ ...formData, location: ev.target.value });
          }}
        />
      </label>

      <label className="flex flex-col">
        <span className="font-semibold mb-1">Title:</span>
        <input
          className="p-2 bg-background-50 border border-text-500 rounded"
          placeholder="Enter title..."
          value={formData.title || ""}
          onChange={(ev) => {
            setFormData({ ...formData, title: ev.target.value });
          }}
        />
      </label>

      <label className="flex flex-col">
        <span className="font-semibold mb-1">Text:</span>
        <textarea
          className="p-2 bg-background-50 border border-text-500 rounded"
          placeholder="Enter text..."
          value={formData.text || ""}
          onChange={(ev) => {
            setFormData({ ...formData, text: ev.target.value });
          }}
        />
      </label>

      <label className="flex flex-col">
        <span className="font-semibold mb-1">Date and Time:</span>
        <input
          type="datetime-local"
          className="p-2 bg-background-50 border border-text-500 rounded"
          onFocus={(ev) => ev.target.showPicker()}
          value={formData.date || ""}
          onChange={(ev) => {
            setFormData({ ...formData, date: ev.target.value });
          }}
        />
      </label>
    </div>
  );
}
