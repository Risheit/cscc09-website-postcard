import { User } from "@/backend/users";
import { faPen, faXmark, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

export default function AboutMe(props: {
  user?: User;
  onEdit?: (formData: { aboutMe: string }) => void;
}) {
  const { user, onEdit } = props;
  const isEditable = !!onEdit;

  const [aboutMeContent, setAboutMeContent] = useState(user?.aboutMe);
  const [isEditing, setIsEditing] = useState(false);
  const [editAboutMe, setEditAboutMe] = useState(user?.aboutMe);

  function handleSubmit(): void {
    if (!editAboutMe) {
      return;
    }

    setIsEditing(false);
    if (onEdit) {
      onEdit({ aboutMe: editAboutMe });
      setAboutMeContent(editAboutMe);
    }
  }

  useEffect(() => {
    setAboutMeContent(user?.aboutMe);
    if (!isEditing) {
      setEditAboutMe(user?.aboutMe);
    }
  }, [user?.aboutMe, isEditing]);

  return (
    <div className="flex gap-3 flex-col bg-background-50 rounded-md p-6  my-8">
      {isEditable && !isEditing && (
        <FontAwesomeIcon
          icon={faPen}
          className="h-4 opacity-50 self-end hover:opacity-100"
          onClick={() => setIsEditing(true)}
        />
      )}
      {isEditable && isEditing && (
        <span className="flex self-end gap-4">
          <FontAwesomeIcon
            icon={faXmark}
            className="h-5 opacity-50 hover:opacity-100"
            onClick={() => setIsEditing(false)}
          />
          <FontAwesomeIcon
            icon={faCheck}
            className="h-5 opacity-50 self-end hover:opacity-100"
            onClick={handleSubmit}
          />
        </span>
      )}

      {!isEditing && <p className="p-4">{aboutMeContent}</p>}
      {isEditing && (
        <textarea
          className="p-2 bg-background-50 border border-text-500 rounded w-full min-h-fit"
          defaultValue={editAboutMe}
          name="username"
          onChange={(ev) => setEditAboutMe(ev.target.value)}
          rows={10}
          autoFocus
          required
        />
      )}
    </div>
  );
}
