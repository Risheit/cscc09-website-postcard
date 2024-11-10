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
          value={formData.locationName || ""}
          onChange={(ev) => {
            setFormData({ ...formData, locationName: ev.target.value });
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
          value={formData.textContent || ""}
          onChange={(ev) => {
            setFormData({ ...formData, textContent: ev.target.value });
          }}
        />
      </label>

      <label className="flex flex-col">
        <span className="font-semibold mb-1">Date and Time:</span>
        <input
          type="datetime-local"
          className="p-2 bg-background-50 border border-text-500 rounded"
          onFocus={(ev) => ev.target.showPicker()}
          value={formData.postedTime || ""}
          onChange={(ev) => {
            setFormData({ ...formData, postedTime: ev.target.value });
          }}
        />
      </label>
    </div>
  );
}
