// create an instance of a db object for us to store the IDB data in
var db;

// all the variables we need for the app
var noteList = document.getElementById('note-list');
var noteTitle = document.getElementById('note-title');
var noteBody = document.getElementById('note-body');
var saveButton = document.getElementById('save');
saveButton.addEventListener('click', addData, false);

var updateButton = document.getElementById('update');
updateButton.setAttribute("note-id", undefined);
updateButton.addEventListener('click', updateNote, false);

function openNote(event) {
    /* Open a note in the text areas for viewing/editing. */
    var openingNoteID = Number(event.target.getAttribute('note-id'));
    console.log("Preparing to open note with ID: ", openingNoteID);

    var objectStore = db.transaction(["notes"]).objectStore("notes");
    var request = objectStore.get(openingNoteID);

    request.onerror = function(event) {
        console.log("! Error retrieving the note with id ", openingNoteID, ": ", event.target.error.name);
    };

    request.onsuccess = function(event) {
        console.log("Successfully opened note ", openingNoteID);
        var data = event.target.result;

        // display the data for this note
        noteTitle.value = data.noteTitle;
        noteBody.value = data.noteBody;
    };

    updateButton.setAttribute("note-id", openingNoteID);
    updateButton.style.visibility = 'visible';
    noteBody.focus();
}

function displayExistingNotes() {
    console.log("Displaying existing notes");
    // clear existing content to avoid duplicates
    noteList.innerHTML = "";

    // open object store
    var objectStore = db.transaction("notes").objectStore('notes');

    // list all of the notes in the database
    objectStore.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;

        if(cursor) {  // if there are items in the database, display them
            var thisNoteContainer = document.createElement('div');
            var thisNote = document.createElement('div');

            var shortTitle = getShortTitle(cursor.value.noteTitle);
            var shortBody = getShortBody(cursor.value.noteBody);

            thisNote.innerHTML = "<b>" + shortTitle + "</b>" + " - " + shortBody;

            thisNote.setAttribute("note-id", cursor.value.id);
            thisNote.setAttribute("id", "listed-note");
            thisNote.setAttribute("title", "Click to Edit");

            thisNote.onclick = function(event) {
                openNote(event);
            }

            // create a delete button inside each list item, giving it an event handler so that it runs the deleteButton()
            // function when clicked
            var deleteButton = document.createElement('button');
            thisNoteContainer.appendChild(deleteButton);
            deleteButton.innerHTML = 'X';

            deleteButton.setAttribute("style", "float: right;");
            deleteButton.setAttribute('id', "delete-button");
            deleteButton.setAttribute("title", "Click to Delete");

            // here we are setting a data attribute on our delete button to say what note we want deleted if it is clicked
            deleteButton.setAttribute('note-id', cursor.value.id);
            deleteButton.setAttribute('note-title', cursor.value.noteTitle);
            deleteButton.onclick = function(event) {
                deleteNote(event);
            }

            // put the item item inside the note list
            thisNoteContainer.appendChild(thisNote);
            noteList.appendChild(thisNoteContainer);

            // add a break after each note
            var breakLine = document.createElement('br');
            noteList.appendChild(breakLine);

            // continue on to the next item in the cursor
            cursor.continue();
        } else {  // if all notes are displayed...
            console.log("All notes displayed");
        }
    }

    noteTitle.focus()
}

function addData(event) {
    console.log("Adding a new note");

    if(noteTitle.value == '') {  // if there is no note title...
        // log an error and return
        console.log("Data not submitted — form incomplete");
        return;
    } else {  // otherwise...
        // grab the values entered into the form fields and store them in an object ready for being inserted into the IDB
        var newNote = { noteTitle: noteTitle.value, noteBody: noteBody.value };

        // open a read/write db transaction, ready for adding the data
        var objectStore = db.transaction(["notes"], "readwrite").objectStore("notes");
        var request = objectStore.add(newNote);

        request.onerror = function(event) {
            console.log("Failed to add new note to database : ", event.target.error.name);
        }

        request.onsuccess = function(event) {
            // report the success of our new note going into the database
            console.log("New note added to database");

            // clear the form, ready for adding the next entry
            noteTitle.value = "";
            noteBody.value = "";
        };
    }

    updateButton.setAttribute("note-id", undefined);
    updateButton.style.visibility = 'hidden';
    displayExistingNotes();
}

function deleteNote(event) {
    // retrieve the title of the note we want to delete 
    var deletingNoteID = Number(event.target.getAttribute('note-id'));
    var deletingNoteTitle = event.target.getAttribute('note-title');
    console.log("Deleting note ", deletingNoteID);

    // confirm that the user really wants to delete the note
    if (confirm("Are you sure you want to delete this note: " + deletingNoteTitle + "?") == true) {
        // open a database transaction and delete the note, finding it by the name we retrieved above
        var objectStore = db.transaction(["notes"], "readwrite").objectStore("notes");
        var request = objectStore.delete(deletingNoteID);

        // report error
        request.onerror = function(event) {
            console.log("! Error deleting note: ", event.target.error.name);
        };

        // report that the data item has been deleted
        request.onsuccess = function() {
            console.log("Note deleted: ", deletingNoteID);

            // remove the possibility to update the note if the note being viewed was the one that was just deleted
            if (updateButton.getAttribute("note-id") == deletingNoteID) {
                updateButton.setAttribute("note-id", undefined);
                updateButton.style.visibility = 'hidden';
            }
        };
    } else {
        console.log("Note was not deleted: user hit cancel.");
    }

    displayExistingNotes();
}

function updateNote(event) {
    var updatingNoteID = Number(event.target.getAttribute('note-id'));
    console.log("Updating note ", updatingNoteID);

    var objectStore = db.transaction(["notes"], "readwrite").objectStore("notes");
    var request = objectStore.get(updatingNoteID);

    request.onerror = function(event) {
        console.log("! Error retrieving the note with id ", updatingNoteID, ": ", event.target.error.name);
    };

    request.onsuccess = function(event) {
        var data = event.target.result;

        // update the notes values
        data.noteTitle = noteTitle.value;
        data.noteBody = noteBody.value;

        // Put this updated object back into the database.
        var requestUpdate = objectStore.put(data);

        requestUpdate.onerror = function(event) {
            console.log("! Error updating the note with id ", updatingNoteID, ": ", event.target.error.name);
        };

        requestUpdate.onsuccess = function(event) {
            console.log("Successfully updated note ", updatingNoteID);

            // hide the button and refresh the view
            updateButton.setAttribute("note-id", undefined);
            updateButton.style.visibility = 'hidden';
            noteTitle.value = "";
            noteBody.value = "";
            displayExistingNotes();
        };
    };
}

function getShortTitle(fullTitle) {
    var MAXTITLELENGTH = 16;

    if (fullTitle.length > MAXTITLELENGTH) {
        return fullTitle.substring(0, MAXTITLELENGTH) + "...";
    } else {
        return fullTitle;
    }
}

function getShortBody(fullBody) {
    var MAXBODYLENGTH = 25;

    if (fullBody.length > MAXBODYLENGTH) {
        return fullBody.substring(0, MAXBODYLENGTH) + "...";
    } else {
        return fullBody;
    }
}

function deleteDB() {
    console.log("Requesting to delete database submitted");

    if (confirm("Are you sure you want to delete ALL of the notes?") == true) {
        window.indexedDB.deleteDatabase("notes");
        console.log("Database deleted");
    } else {
        console.log("DB not deleted: user hit cancel.");
    }

    // refresh the page
    document.location.reload(true);
}

window.onload = function() {
    console.log("Note-Taker initialized");

    noteTitle.focus();

    // In the following line, you should include the prefixes of implementations you want to test.
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    // DON'T use "var indexedDB = ..." if you're not in a function.
    // Moreover, you may need references to some window.IDB* objects:
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    // (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB. You will not be able to save and edit notes.");
    }

    // Let us open our database
    var DBOpenRequest = window.indexedDB.open("notes", 4);

    // Gecko-only IndexedDB temp storage option:
    // var request = window.indexedDB.open("notes", {version: 4, storage: "temporary"});

    // if the database was NOT properly initialized...
    DBOpenRequest.onerror = function(event) {
        console.log("! Error initializing database: ", event.target.error.name);
    };

    // if the database was properly initialized...
    DBOpenRequest.onsuccess = function(event) {
        console.log("Indexed-DB initialized");

        // store the result of opening the database in the db variable. This is used a lot below
        db = DBOpenRequest.result;

        // Run the displayExistingNotes() function to populate the note list with all the to-do list data already in the IDB
        displayExistingNotes();
    };

    // This event handles the event whereby a new version of the database needs to be created
    // Either one has not been created before, or a new version number has been submitted via the window.indexedDB.open line above it is only implemented in recent browsers
    DBOpenRequest.onupgradeneeded = function(event) { 
        console.log("Upgrading Indexed-Database");
        var db = event.target.result;

        db.onerror = function(event) {
            console.log("! Error loading database: ", event.target.error.name);
        };

        // Create an objectStore for this database
        var objectStore = db.createObjectStore("notes", { autoIncrement: true, keyPath: 'id'});

        // define what data items the objectStore will contain
        objectStore.createIndex("noteTitle", "noteTitle", { unique: false });
        objectStore.createIndex("noteBody", "noteBody", { unique: false });
        console.log("Object store created");
    };
}