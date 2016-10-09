// create an instance of a db object for us to store the IDB data in
var db;

/*  All notes are stored in the format:
var newNote = [
    { noteTitle: "Note Title", noteBody: "Note Body" }
];
*/

// all the variables we need for the app
var noteList = document.getElementById('note-list');

var noteTitle = document.getElementById('note-title');
var noteBody = document.getElementById('note-body');
var save = document.getElementById('save');

function getShortBody(fullBody) {
    if (fullBody.length > 25) {
        return fullBody.substring(0, 25) + "...";
    }

    return fullBody;
}

window.onload = function() {
    console.log("Note-Taker initialized");

    // set the focus on the noteTitle field
    noteTitle.focus()

    // In the following line, you should include the prefixes of implementations you want to test.
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    // DON'T use "var indexedDB = ..." if you're not in a function.
    // Moreover, you may need references to some window.IDB* objects:
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    // (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
    }

    // Let us open our database
    var DBOpenRequest = window.indexedDB.open("notes", 4);

    // Gecko-only IndexedDB temp storage option:
    // var request = window.indexedDB.open("notes", {version: 4, storage: "temporary"});

    // if the database was not properly initialized...
    DBOpenRequest.onerror = function(event) {
        console.log("! Error initializing database: ", event.target.error.name);
    };

    // if the database was properly initialized...
    DBOpenRequest.onsuccess = function(event) {
        console.log("Indexed-Database initialized");

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
            console.log("! Error loading database");
        };

        // Create an objectStore for this database
        var objectStore = db.createObjectStore("notes", { keyPath: "noteTitle" });

        // define what data items the objectStore will contain
        objectStore.createIndex("noteBody", "noteBody", { unique: false });
        console.log("Object store created");
    };

    function openNote(event) {
        /* Open a note in the text areas for viewing/editing. */
        var openingNoteTitle = event.target.getAttribute('note-title');

        console.log("Preparing to open note with title: ", openingNoteTitle);

        // open a database transaction and delete the note, finding it by the name we retrieved above
        var transaction = db.transaction(["notes"], "readwrite");
        var request = transaction.objectStore("notes").get(openingNoteTitle);

        // report that the data item has been deleted
        transaction.oncomplete = function() {
            // delete the parent of the button, which is the list item, so it no longer is displayed
            noteTitle.value = request.result.noteTitle;
            noteBody.value = request.result.noteBody;
            console.log("open request", request);
            console.log("Note opened: ", request.result.noteTitle);
        };

        // set the focus on the noteBody field
        noteBody.focus()
    }

    function displayExistingNotes() {
        // first clear the content of the note list so that you don't get a huge long list of duplicate stuff each time the display is updated.
        noteList.innerHTML = "";

        console.log("db", db);

        // open our object store
        var objectStore = db.transaction("notes").objectStore('notes');

        console.log("obj store", objectStore);

        // list all of the objects in the database and display them
        objectStore.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;

            if(cursor) {  // if there are items in the database, display them
                // create a list item to put each data item inside when displaying it
                var listItem = document.createElement('div');

                shortBody = getShortBody(cursor.value.noteBody);

                // build the to-do list entry and put it into the list item via innerHTML.
                listItem.innerHTML = "<b>" + cursor.value.noteTitle + "</b>" + " - " + shortBody

                listItem.setAttribute("note-title", cursor.value.noteTitle);
                listItem.setAttribute("note-body", cursor.value.noteBody);
                listItem.setAttribute("id", "listed-note");
                listItem.setAttribute("title", "Click to Edit");

                listItem.onclick = function(event) {
                    openNote(event);
                }

                // put the item item inside the note list
                noteList.appendChild(listItem);

                // add a break after each note
                var breakLine = document.createElement('br');
                noteList.appendChild(breakLine);

                // // create a delete button inside each list item, giving it an event handler so that it runs the deleteButton()
                // // function when clicked
                // var deleteButton = document.createElement('button');
                // listItem.appendChild(deleteButton);
                // deleteButton.innerHTML = '<img src="./style/delete.png" style="width: 2em; height: 2.25em;">';

                // deleteButton.setAttribute('id', "delete-button");
                // deleteButton.setAttribute("title", "Click to Delete");

                // // here we are setting a data attribute on our delete button to say what note we want deleted if it is clicked
                // deleteButton.setAttribute('note-title', cursor.value.noteTitle);
                // deleteButton.onclick = function(event) {
                //     deleteItem(event);
                // }

                // continue on to the next item in the cursor
                cursor.continue();
            } else {  // if all notes are displayed...
                console.log("All notes displayed");
            }
        }

        // set the focus on the noteTitle field
        noteTitle.focus()
    }

    // give the save button an event listener so that when a note is saved, the addData() function is run
    save.addEventListener('click', addData, false);

    function addData(e) {
        // prevent default - we don't want the form to submit in the conventional way
        e.preventDefault();

        if(noteTitle.value == '') {  // if there is no note title...
            // log an error and return
            console.log("Data not submitted — form incomplete");
            return;
        } else {  // otherwise...
            // grab the values entered into the form fields and store them in an object ready for being inserted into the IDB
            var newNote = [
                { noteTitle: noteTitle.value, noteBody: noteBody.value }
            ];

            // open a read/write db transaction, ready for adding the data
            var transaction = db.transaction(["notes"], "readwrite");

            // report on the success of opening the transaction
            transaction.oncomplete = function() {
                console.log("Database updated");

                // update the display of data to show the newly added item, by running displayExistingNotes() again.
                displayExistingNotes();
            };

            transaction.onerror = function() {
                console.log("! Error performing transaction: ", transaction.error);
            };

            // call an object store that's already been added to the database
            var objectStore = transaction.objectStore("notes");
            console.log(objectStore.indexNames);
            console.log(objectStore.keyPath);
            console.log(objectStore.name);
            console.log(objectStore.transaction);
            console.log(objectStore.autoIncrement);

            // add our newNote object to the object store
            console.log("newNote[0]", newNote[0])
            var objectStoreRequest = objectStore.add(newNote[0]);
            objectStoreRequest.onsuccess = function(event) {
                // report the success of our new note going into the database
                console.log("New note added to database");

                // clear the form, ready for adding the next entry
                noteTitle.value = '';
                noteBody.value = "";
            };

            objectStoreRequest.onerror = function(event) {
                // The likely cause of this error is that the user is trying to save a note with a title that already exists.  This system does not allow for duplicate titles
                console.log("Failed to add new note to database (likely because a note with the same title already exists)", event);

                // create a pnotify message displaying a notification for the user
                PNotify.prototype.options.mouse_reset = false;

                $(function(){
                    new PNotify({
                        title: 'DUPLICATE TITLE DETECTED',
                        text: 'Each title must be unique.  Try saving the note again with a <b>different title</b>.'
                    });
                });

                // set the focus on the noteTitle field
                noteTitle.focus()
            }
        }
    }

    function deleteItem(event) {
        // retrieve the title of the note we want to delete 
        var deletingNoteTitle = event.target.getAttribute('note-title');

        console.log("Preparing to delete note with title: ", deletingNoteTitle);

        // confirm that the user really wants to delete the note
        if (confirm("Are you sure you want to delete this note: " + deletingNoteTitle + "?") == true) {
            // open a database transaction and delete the note, finding it by the name we retrieved above
            var transaction = db.transaction(["notes"], "readwrite");
            var request = transaction.objectStore("notes").delete(deletingNoteTitle);

            // report that the data item has been deleted
            transaction.oncomplete = function() {
                // delete the parent of the button, which is the list item, so it no longer is displayed
                event.target.parentNode.parentNode.removeChild(event.target.parentNode);
                console.log("Note deleted: ", deletingNoteTitle);
            };
        } else {
            console.log("Note was not deleted: user hit cancel.");
        }

        // set the focus on the noteTitle field
        noteTitle.focus()
    }
}