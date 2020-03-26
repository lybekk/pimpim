<template lang="pug">
div
  v-skeleton-loader(
    :loading="!doc._id"
    class="mx-auto"
    transition="scale-transition"
    type="article"
  )
    v-card
      v-card-title(
        class="subheading"
      )
        v-row
          v-col
            tasks-items-title(
              v-bind:id='doc._id'
              v-bind:title='doc.title'
              v-bind:status='doc.status'
              @set-doc="setDoc()"
            )
      v-fade-transition
        v-overlay(
          v-if='isDeleted(doc._id)'
          absolute
          color='error'
          z-index='3'
        )
          v-btn(text) Deleted
      v-fade-transition
        v-overlay(
          v-if="doc.archived"
          absolute
          color="success lighten-2"
          z-index="3"
        )
          v-btn(text) Archived
      v-card-subtitle
        tasks-items-description(
          v-bind:task='doc'
          @set-doc="setDoc()"
        )
      div
        span
          v-chip(
            v-if='isOverdue(doc)'
            small
            label
            color='error'
          ) {{ overdueAmount(doc.due) }} Overdue 
          v-chip(
            v-if="doc.status == 'done'"
            small
            label
            color='success'
          ) Done
          v-chip(
            v-if='isPostponed(doc._id)'
            small
            label
            color='info'
          ) Postponed
      v-divider(inset width="80%")
      v-card-text
        v-expansion-panels(
          hover
          flat
          tile
        )
          tasks-items-status(
            v-bind:task='doc'
            @set-status="setTaskStatus"
          )
          tasks-items-priority(
            v-bind:task='doc'
            @set-doc="setDoc()"
          )
          tasks-items-project(
            v-if="doc.type != 'project'"
            v-bind:task='doc'
            @set-doc="setDoc()"
          )
          tasks-items-dates(
            v-bind:task='doc'
            v-bind:is-overdue='isOverdue(doc)'
            v-bind:is-deleted='isDeleted(doc._id)'
            @set-doc="setDoc()"
          )
          v-row
            v-col
              tasks-items-tags(
                v-bind:task='doc'
                @set-doc="setDoc()"
              )
            v-col
              tr(class="font-weight-thin")
                td ID:
                td(v-text="doc._id")
            v-col
              main-delete-button(v-bind:document-id='doc._id')
            v-col
              v-tooltip(top)
                template(v-slot:activator='{ on }')
                  v-btn(
                    fab
                    small
                    :outlined="!isPostponed(doc._id)"
                    color='info'
                    v-on='on'
                    @click='postponeTask(doc._id)'
                  )
                    v-icon mdi-update
                span Postpone until tomorrow
              v-tooltip(top)
                template(v-slot:activator='{ on }')
                  v-btn(
                    fab
                    small
                    :outlined="doc.status != 'done'"
                    :color="color(doc.status)"
                    v-on='on'
                    @click="setTaskStatus('done')"
                  )
                    v-icon mdi-check
                    //- OUTLINED if not done. Filled&disabled if done. Put button outside fab?
                      :class="[ isDone(doc._id) ? 'success--text' : '' ]"
                      color='success'
                span Mark done
              //--v-tooltip(top)
                template(v-slot:activator='{ on }')
                  v-btn(
                    fab
                    small
                    color='success'
                    v-on='on'
                    @click="setTaskStatus(doc._id, 'done')"
                  )
                    v-icon mdi-check
                    //- OUTLINED if not done. Filled&disabled if done. Put button outside fab?
                span Mark done
              //- (TODO) x-Small btn with brackets for viewing raw document (tied to app - general tool for editing json)
          //-main-delete-button(v-bind:document-id='doc._id')

</template>

<script>
import TasksItemsStatus from '@/components/tasks/TasksItemsStatus.vue'
import TasksItemsTitle from '@/components/tasks/TasksItemsTitle.vue'
import TasksItemsDescription from '@/components/tasks/TasksItemsDescription.vue'
import TasksItemsProject from '@/components/tasks/TasksItemsProject.vue'
import TasksItemsTags from '@/components/tasks/TasksItemsTags.vue'
import TasksItemsPriority from '@/components/tasks/TasksItemsPriority.vue'
import TasksItemsDates from '@/components/tasks/TasksItemsDates.vue'
import MainDeleteButton from '@/components/MainDeleteButton.vue'
import pouchMixin from '@/mixins/pouchMixin'

export default {
  name: 'tasksItem',
  components: {
    TasksItemsStatus,
    TasksItemsTitle,
    TasksItemsDescription,
    TasksItemsDates,
    MainDeleteButton,
    TasksItemsProject,
    TasksItemsTags,
    TasksItemsPriority,
  },
  mixins: [pouchMixin],
  props: ['docid'],
  data: () => ({
    doc: {
      title:'',
      tags:[],
    },
    fab:false
  }),
  computed: {
  },
  mounted () {
    this.setDoc()
  },
  beforeDestroy() {
  },
  methods: {
    setDoc: async function() {
      this.doc = await this.getDoc(this.docid)
    },
    //copied from former component. For rewrite
    overdueAmount: function (due) {
      let dDue = new Date(due);
      let dNow = new Date();
      let diff = dNow - dDue;
      let hours = Math.floor(diff / (1000 * 60 * 60))
      let msg = hours + ' hours '
      return msg
    },
    statusClass: function(status) {
      let sc = {
        cancelled: 'grey--text',
        wait: 'white',
        plan: 'grey darken-4 white--text',
        todo: 'info',
        next: 'warning',
        doing: 'primary',
        done: 'success'
      };
      return sc[status]
    },
    setTaskStatus: async function(newStatus) {
      let doc = await window.db.get(this.doc._id);
      doc.status = newStatus;
      if ( ['done','cancelled'].includes(newStatus) ) {
          doc.end = new Date().toJSON();
      }
      await this.putDoc(doc)
      this.setDoc()
      setTimeout(()=>{
          this.$store.dispatch('getTaskStatuses');
        }, 4000);

    },
    getTaskStatus: function(id) {
      return this.$store.getters.getTaskStatus(id)
    },
    postponeTask: async function(id) {
      var currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + 1);
      let tom = currentDate.toISOString().slice(0,10);
      let payload = {
        _id:id, 
        field:'due', 
        value: tom
      };
      await this.setFieldDate(payload)
      this.$store.commit('addPostponed', id);
      this.setDoc();
    },
    isOverdue: function(doc) {
      //let task = this.$store.getters.getTask(key);
      let d = new Date();
      d.setDate(d.getDate() - 1);
      let d_today = new Date();
      let date_today = d_today.toISOString().slice(0,10);
      if (date_today > doc.due && doc.status != "done" ) {
          return true
      }
      return false
    },
    isPostponed: function(id) {
      let list = this.$store.getters.getPostponedTasks;
      if ( list.includes(id) ) {return true}
      return false
    },
    isDeleted: function(id) {
      let list = this.$store.getters.getDeletedDocuments;
      if ( list.includes(id) ) {return true}
      return false
    },
    color: function (status) {
      return this.$store.getters.getStatusColors[status]
    },
  }
}

</script>