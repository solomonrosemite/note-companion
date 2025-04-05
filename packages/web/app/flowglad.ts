import { FlowgladServer } from '@flowglad/nextjs/server'
 import { currentUser } from '@clerk/nextjs/server'
 
 export const flowgladServer = new FlowgladServer({
   clerk: {
     currentUser,
   },
 }) 