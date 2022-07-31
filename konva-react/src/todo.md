# TODO list

## Debugging

Run 'code .' in the 'konva-react' folder.  Then run 'npm start' in a powershell window.  That will run the "Development Server"
and it'll start running.  Recall that the 'start' verb is defined in ..\package.json.

## Bugs

  [x] Fix positioning of tooltips (not appearing to take relative positioning into account like it should.)
  [x] Tooltip Position doesn't update after component is moved
  [x] Tooltip should pop down on mouse click in interactable
  [x] Margin around tooltip is uneven.
  [x] Timer control in toolbar isn't hourglass
  [x] Enter closes the description editor - shift enter doesn't.
  [ ] Maybe make a visible thing on a component with a description
  [x] Have the on/off sequence for inputs show in the inputs tooltip
  [x] Have the timer have a default tooltip that shows how many ticks it has

  [ ] Update the help with information on tooltips and saved button states
  [ ] Rewrite the main readme, maybe create a readme in the konva-react directory

  [x] Pressing 'a', 'o' etc. while a logic gate is selected should convert it (?)
  [x] Timer looks a bit awkward with small, odd numbers of ticks
  [ ] Data > 4k will jack up the cookie backup system.

## Code Cleanup

- [ ] Many non-react things.  (Tooltips mainly)
- [ ] Rename App
- [ ] Fix up how images are loaded
