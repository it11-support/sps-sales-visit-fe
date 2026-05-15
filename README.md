# SPS SalesHub
## Features
### 1. Administrator
- Manage Sales Persons (link to user)
- View all customers
- Analyze sales performance
- Manage Activity (Assignment)
- View activity report
### 2. Sales Coordinator
- Manage Sales Persons (link to user)
- View all customers
- Analyze sales performance
- Manage Activity (Assignment)
- View activity report
### 3. Supervisor
- Manage Sales Persons (link to user)
- View all customers
- Analyze sales performance
- Manage Activity (Assignment)
- View activity report
### 4. Sales Person
- View customers belongs to the sales person
- View activities (Assingment)
- Input sales visit report

## Documentation
### Administrator
---
### 1. User Administration
#### 1.1 Add User
- Navigate to `Users > Users List (/users/list)`
- Click `Add New User` button
- Pop up will appear 
- Fill the user form
- Click submit

#### 1.2 Edit User
- Navigate to `Users > Users List (/users/list)`
- Click the 3 dots button in the action column corresponding to the row you want to edit
- Click edit button on the menu list
- Pop up will appear
- Change the user fields
- **Leave the password field blank if there is no password change**
- Click submit

#### 1.3 Link / Unlink Sales Person
- Navigate to `Users > Users List (/users/list)`
- Click the 3 dots button in the action column corresponding to the row you want to link / unlink

> ##### 1.3.1 Unlink Sales Person
- If already linked, click the `Unlink Sales Person` Button
- Pop up menu will appear
- Click the `Unlink` button

> ##### 1.3.2 Link Sales Person
- If not Linked, click  the `Link Sales Person` button
- Pop up menu will appear
- Select Sales Person from the list
- Click the `Link` Button

### 2. Activity Assignment
*Requires customers already connected to a specific sales person*

#### 2.1 Create an Activity
- Navigate to customer list `(/customers/list)`
- Click the `Show Filters` checkbox and wait for all filters to initialize.
- Select a Sales person from `Filter by sales persin` dropdown menu
- It will load customers according to the selected sales person
- Click on the `View` button in the action column on a customer
- Click on the `Create Activity` button
- Create activity pop up menu will appear
- Fill the fields (Date, Activity Type and Notes)
- Click on the `Submit` button
- If selected customer has no linked sales person, Link sales persin pop up menu will appear
- Select an available user from the list
- Click on the `Link` button
- Repeat the process from [2.1 Create an Activity](#21-create-an-activity)

### User
---
### 1. Sales Visit Report
>*Ideally this process is carried out on site during a sales visit using a device with camera access.*

#### 1.1 Input Sales Visit Report
- Navigate to Activity List `(/activity/list)`
- Check for assignments with status `Assigned`
- Click on the `Check In` button to start the proccess
- Once completed, you will be directed to the report page
- Navigate to `Activity Report` section
- Fill the fields
- You can save as a draft after the `Reason Quantity Drop` and `Activity Purpose` are filled in and continue later
- Click on the `Plus Button` to add competitors data if any
- Click the `Take Photo` button to take a picture
    - *This step can be done at any time no matter the order*
    - *In addition to taking picture, it will take location*
    - *Camera and location permissions must be granted when opening the camera.*
- If all fields are filled the submit button will appear
- Click the `Submit` button to save the report (*Not available for edit after submit*)

#### 1.2 Edit Sales Visit Report
*You can edit sales reports that have not been submitted.*
- Navigate to Activity List `(/activity/list)`
- Check for assignments with status `Draft`
- Click on the `Edit Report` button
- Will be redirected to edit report page `/activity/[id]/report/edit`
- Continue as in the previous step [1.1 Input Sales Visit Report](#11-input-sales-visit-report)


#### Feature Updates
🚀 Sync assignment data before store
✨ Upload image if camera inaccessible
🚀 Edit Completed report
