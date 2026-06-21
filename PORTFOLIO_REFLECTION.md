# CS 360 Mobile Application Portfolio Artifact

## App Purpose and User Needs

My artifact is PalletFlow, a reseller inventory mobile application. It was designed to help independent resellers track items from pallets, returns, open-box merchandise, and other resale inventory. The app addresses the need for a simple way to create an account, record inventory items, track quantities, update or remove items, and receive optional alerts when inventory is low.

## User-Centered Design

The app includes a login screen, an inventory grid, an item-entry form, and an SMS alerts screen. The login screen gives new users a clear way to create an account and returning users a way to sign in. The inventory grid displays SKU, item name, quantity, and delete controls in one place. Users can tap an item to select it for updating, which keeps editing straightforward. The screens use consistent colors, readable labels, grouped controls, and bottom navigation so users can move between inventory and alert settings without confusion.

## Coding Approach

I developed the app by starting with the UI design and then connecting each screen to functional Java code. I used SQLite to create persistent tables for user accounts and inventory items. I implemented create, read, update, and delete operations so the inventory grid stays synchronized with the database. I also added runtime SMS permission handling so low-stock alerts are optional. This approach can be applied to future projects by breaking a larger app into smaller features, testing each feature as it is developed, and using persistent storage when data must remain after an app closes.

## Testing

I tested the app by creating and logging into an account, adding sample inventory, selecting and updating an item, deleting an item, and reopening the app to verify that the data persisted. I also tested SMS permission behavior. When permission was allowed, the app enabled low-stock alerts; when permission was denied, inventory functions continued normally. Testing is important because it confirms that the app behaves correctly in both expected and restricted situations.

## Challenges and Innovation

One challenge was turning a static UI mockup into a complete functional app while keeping the interface simple. I addressed this by connecting the existing inventory grid to SQLite and making rows selectable for updating. I also designed the SMS feature so it does not interfere with the rest of the app when a device cannot send messages or a user denies permission.

## Demonstrated Skills

I was particularly successful in implementing the persistent inventory database and CRUD workflow. This feature demonstrates my ability to connect Android UI components to SQLite data, validate user input, update a visible grid, and preserve information between app sessions. It also demonstrates mobile development best practices through meaningful names, concise methods, comments, and permission-aware behavior.
