
# Raw User Feedback – Scheduling Widget

This document contains unfiltered, word-for-word user feedback collected during testing of the scheduling widget along with responses and current development status (as of May 2025).
---

- "Once you overwrite, that's it– you can't reconcile it back to the template, right?"  
Kaden's Response: Yes, that’s currently how it works. However, as of May 9th, 2025, I’ve added a delete option so deleting a conflicting shift will now restore the template version after a refresh.

---

- "Can you have repeating stations or tasks relative to the whole calendar? How would I indicate I have a 1:1 with Kenny every 2nd Thursday of the month at 2?"  
Kaden's Response: This specific recurrence pattern isn’t supported yet (segment-specific recurrence as opposed to entire shift recurrence), but I’m working on making that addition. Your end goal can still be completed with the current system: build a default recurring shift every 2nd Thursday of the month for a recurring 1:1 with Kenny, then overwrite it when you need to make additions.

---

- (5/9/2025) New bug: While modding my evening shift, I saved to whole series, and it overwrote every day of the week to be an evening shift.  
Kaden's Response: I'm attempting to reproduce this bug - this has not occured in testing, so I am making efforts to identify the source.

---

- Can we edit the tag once it's made?  
Kaden's Response: Yes, editing tags is supported — the edit button may have been hidden due to dark mode issues, which have now been resolved.

---

- This is what I see when I am in the Tags tab. I don't see any spot for editing.  
Kaden's Response: As of May 9th, 2025 this feature has been added. Click the edit button in the top right.

---

- Ok now it's fixed, however do note: after making changes you must reassign the segment to the tag for changes to take effect… working on fixing this.  
Kaden's Response: Yes, this is a known behavior — I’m working on making tag edits propagate automatically to existing segments.

---

- Is it possible to create profiles for people, or do they need to log in and populate their schedule?  
Kaden's Response: Yes, it’s now possible as of May 9th, 2025. Inviting someone now automatically creates a user account so admins can begin scheduling right away. Before, the user account was not created until the user signed up. Simple workflow change.

---

- I was not expecting the delay between creating the weekly schedule.  
Kaden's Response: Thank you for flagging this — the delay was related to the UI not updating instantly. I’m working on resolving this with better real-time updates.

---

- Seems to be better when I just refresh the screen.  
Kaden's Response: Confirmed — refresh temporarily resolves the issue. I'm actively working on making all changes reflect immediately without requiring a refresh.

---

- Frequencies I see when putting in a recurrence are: none, daily, weekly, monthly. If something is happening every 3 weeks- I do not see how that can be indicated.  
Kaden's Response: This functionality exists but may not be clearly visible depending on light/dark mode. I’ll be adding a tips section to clarify recurrence options.

---

- Can you just delete a whole shift? We can delete blocks within a shift, but I don't see "just delete today".  
Kaden's Response: Yes — as of May 9th, 2025 I’ve added a delete button that removes the entire shift and refreshes the screen automatically.

---

- I just noticed when you hover over Overwrite vs Save it tells you which is which. That's good once you realize it's there.  
Kaden's Response: I'm glad it helped. I’ll also include this in a new tips section to make it more obvious.

---

- Text when filling in the dialog box (logging in, filling out a shift parameter) needs to be black. it's currently either white or gray.  
Kaden's Response: This was due to a dark mode styling issue — it’s been fixed as of 5/9/2025.

---

- Trash icon for removing the segment should be darker.  
Kaden's Response: Resolved — icon visibility improved on 5/9/2025 by fixing dark mode rendering.

---

- When you start a new segment, can it default to 1 hour?  
Kaden's Response: Yes, the default segment length is now set to 1 hour as of 5/9/2025.
