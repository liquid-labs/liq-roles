# Roles Overview and Design

## Purpose and scope

This document provides an oveview and discusses the design of roles and jobs in the liq ecosystem.

## Overview: roles and jobs

- A role is a logical collection of powers and responsibilities.
- Roles may imply other roles. E.g., a 'Lead Engineer' implies the "lower level" base roles of 'Engineer', 'Manager', and 'Staff'.
- A role may be 'singular', meaning it can only be assigned to one person (or entity) at a time.
- A role may be 'designated', meaning that it is applied directly to a staff member (rather than bundled in a job).
- There are basic, immutable 'core roles' defined by liq which may be referenced from policy and logic.
- A job is a collection of one or more roles. There is a 'many-to-many' relationship between jobs and roles. One job will ofetn encompass multiple roles and the same role may be referenced by many jobs.
- Jobs are terminal and do not inherit.
- Jobs have a title.
- Staff are assigned one or more jobs.
- A job (with a Manager role, direct or implied) may directly manage one or more other jobs.

## Managing roles

- The core roles are imported.
- You can import 'org structures' which add specialized roles and define a set of jobs.
- Org structures are designed in series to support growth. E.g., a software series might start with just founders, then add developers and such, and eventually grow to a large org with hundreds of job titles.
- Once imported, structures may be locally modified (though this may lead to incompatibility with org structures later in the series).

## Technical model and notes

- Roles are loaded to the org. This must happen before any staff are loaded. (TBD)
- Roles are attached to staff as a org.hooks.staff.STAFF_MEMBER_LOADED (TBD)