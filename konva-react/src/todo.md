# Debugging

Run 'code .' in the 'konva-react' folder.  Then run 'npm start' in a powershell window.  That will run the "Development Server"
and it'll stay running.  Recall that the 'start' verb is defined in ..\package.json.

# Todo List

## Make it friendlier

  [ ] There should be an introduction page instead of the garbage on the bottom.
  [x] Ctrl+Click on input should toggle inputs
  [ ] 'a' should create an 'and' gate and 'shift-a' should create a nand gate.  Similarly for 'o' and 'x'
  [ ] Tooltips should show keyboard shortcuts
  [ ] Create a setting that shows/hides the save state
  [ ] Add a way for people to enter tooltip information for interactables
  [ ] Inputs could remember their on/off state, pressing a "Reload" could cause them to play back
  [ ] A context menu could be used to make the timer configurable?

## Code Cleanup

- [ ] Rename App
- [ ] Convert to React Hooks
- [ ] Make it not do a full redraw on move
- [ ] Fix up how images are loaded

## Cut ideas

- [ ] All Input/Timer/LogicGate buttons can work on any interactable
