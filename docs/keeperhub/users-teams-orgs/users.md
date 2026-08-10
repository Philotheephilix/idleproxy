<!-- source: https://docs.keeperhub.com/users-teams-orgs/users -->

# User Management

# User Management

Your KeeperHub user account is the foundation of your platform access. This guide covers account management and user settings.

## Account Creation[](https://docs.keeperhub.com/users-teams-orgs/users#account-creation)

New users can create an account through:

-   **Email Registration**: Sign up with email and password
-   **Social Authentication**: Connect via supported OAuth providers

Upon account creation, a Turnkey wallet is automatically provisioned for your organization once your email is verified.

## User Profile[](https://docs.keeperhub.com/users-teams-orgs/users#user-profile)

Your profile contains:

-   **Display Name**: How you appear to other organization members
-   **Email Address**: Used for account access and notifications
-   **Wallet Address**: Your organization’s Turnkey wallet address

## Account Settings[](https://docs.keeperhub.com/users-teams-orgs/users#account-settings)

Access your account settings to:

-   Update display name
-   Change email address
-   Manage authentication methods
-   Change your password
-   View wallet information
-   Deactivate your account

## Password Management[](https://docs.keeperhub.com/users-teams-orgs/users#password-management)

### Changing Your Password[](https://docs.keeperhub.com/users-teams-orgs/users#changing-your-password)

You can change your password from account settings. Enter your current password, then provide and confirm a new password. Passwords must be at least 8 characters. You will be signed out after changing your password and must sign in again.

### Forgot Password[](https://docs.keeperhub.com/users-teams-orgs/users#forgot-password)

If you forget your password, use the forgot password flow from the sign-in page. Enter your email address and a one-time verification code (OTP) will be sent to you. The code expires after 5 minutes. Enter the code along with your new password to complete the reset.

### OAuth Users[](https://docs.keeperhub.com/users-teams-orgs/users#oauth-users)

If you signed up with a social provider (Google or GitHub), your password is managed by that provider. The change password option will direct you to your provider’s account settings. If you attempt a password reset, you will receive an email indicating which provider manages your account.

## Personal Workflows[](https://docs.keeperhub.com/users-teams-orgs/users#personal-workflows)

As an individual user, you can:

-   Create workflows in your personal workspace
-   Test and deploy automations
-   Access your run history
-   Manage notification connections

## Organization Membership[](https://docs.keeperhub.com/users-teams-orgs/users#organization-membership)

Users can belong to one or more organizations:

-   Accept invitations to join organizations
-   Access shared workflows within organizations
-   Collaborate with organization members

See [Organizations](https://docs.keeperhub.com/users-teams-orgs/organizations) for details on organization features.

## API Access[](https://docs.keeperhub.com/users-teams-orgs/users#api-access)

Generate API keys for programmatic access:

-   Create keys for workflow management
-   Set appropriate scopes for each key
-   Rotate keys for security

See [API Authentication](https://docs.keeperhub.com/api/authentication) for details.

## Data and Privacy[](https://docs.keeperhub.com/users-teams-orgs/users#data-and-privacy)

-   Your workflows and run data are private to you and your organizations
-   Turnkey wallet private keys stay inside secure hardware enclaves and are never stored by KeeperHub

### Account Deactivation[](https://docs.keeperhub.com/users-teams-orgs/users#account-deactivation)

You can deactivate your account from account settings. To confirm, you must type **DEACTIVATE** in the confirmation dialog. Deactivation is a soft delete — your data is preserved, but you will be signed out and unable to sign in. All active sessions are invalidated immediately. To reactivate a deactivated account, contact an administrator.
