// node modules
window.jQuery = window.$ = require('jquery')
import Vue     from 'vue';
import parser  from 'simple-sql-parser';
import cleaner from 'dirty-markup';
// scss
require('./../scss/pritify.scss')
require('./../scss/spinner.scss')



// initiating vue instance
var vm = new Vue({
  el:"#app",
  template:"#application",
  data: {
    query:"",
    fixType: "",
    emoji: false,
    cleanHtml: true,
    error:false,
    ticketId: "",
    ticketIdError: false,
    parameters: false,
    ptype: "ticketFix",
    loading:false,
    generatedCode: "",
  },
  computed:{
    placeholder: function() {
      if(this.parameters) {
        return `parameters => {......}`
      } else {
        return `Insert Into ... (...... )`;
      }
    }
  },
  methods: {
    generateCode: function() {
      this.generatedCode = "";
      // has invalid emoji check
      if(this.query.indexOf("�")) {
        this.emoji = true;
      } else {
        this.emoji = false;
      }
      // checking for ticket display id
      if(!this.ticketId) {
        this.ticketIdError = true;
        return;
      } else {
        this.ticketIdError = false;
      }
      // codes for ticket data fix
      if(this.query.indexOf(`helpdesk_ticket_bodies`) > -1) {
        this.fixType = "Ticket Fix";
        this.error = false;
        this.tickeFix();
      }
      else if(this.query.indexOf(`helpdesk_note_bodies`) > -1) {
        this.fixType = "Note Fix";
        this.error = false;
        this.noteFix();
      }
      else {
        this.error = true;
      }
    },
    tickeFix: function() {
        this.loading = true;
        let data = parser.sql2ast(this.query).VALUES[0];
        let templateData = {};
        templateData.accountId = data[0];
        templateData.description = this.cleanEmoji(data[2],false);
        var promise = new Promise((resolve,reject) => {
          this.cleanHtml(this.cleanEmoji(data[3],true),resolve,reject);
        });

        promise.then((data) => {
          templateData.descriptionHtml = data;
          this.tktFixTemplate(templateData);
          this.loading = false;
        },(err) => {
          alert("Something went wrong !");
        });
    },
    noteFix: function() {
      this.loading = true;
      let query = this.query;
      console.log(query);
      $.ajax({
        url:"parser",
        type:"POST",
        data: {
          code: query
        },
        success: function(data) {
          console.log(data);
        }
      });
    },
    getValues: function() {
      let regex = /VALUES \(([\w\W]*?)\)/g;
      let str = this.query;
      let m;
      while ((m = regex.exec(str)) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === regex.lastIndex) {
              regex.lastIndex++;
          }
          return m[1];
      }
    },

    cleanEmoji: function(data,html) {
      let temp = data.replace(/�/g,"");
      if(!html) {
        temp = temp.replace(/\\n/g, '');
      } else {
        temp = temp.replace(/\\n/g, '<br />');
      }
      temp = "#@"+temp+"#@";
      temp = temp.replace(/#@'/g,"").replace(/'#@/g,"");
      return temp;
    },
    cleanHtml: function(html,resolve,reject) {
      html = html.replace(/\\"/g,'');
      $.ajax({
        url:"/clean-html",
        type:"POST",
        data: {
          code:html,
        },
        success: function(data) {
          data = JSON.parse(data);
          let regex = /<body>([\w\W]*?)<\/body>/g;
          let str = data.clean;
          let m;
          let result;
          while ((m = regex.exec(str)) !== null) {
              // This is necessary to avoid infinite loops with zero-width matches
              if (m.index === regex.lastIndex) {
                  regex.lastIndex++;
              }
              result = m[1];
          }
          $.ajax({
            url:"/minify",
            type:"POST",
            data: {
              code:html,
            },
            success: function(data) {
              resolve(data.replace(/"/g,'\\"'));
            },
            error: function(data) {
              alert("something went wrong");
            }
          });
        },
        error:function(data) {
          reject(data)
        }
      });
    },
    tktFixTemplate: function(data) {
      let tktFixTemplate = `
         description = "${data.description}"


          description_html = "${data.descriptionHtml}"


          @script_tickets2 = {}
          account_id = ${data.accountId}
          Sharding.select_shard_of(account_id) do
          account = Account.find_by_id(account_id).make_current
          ticket = account.tickets.find_by_display_id ${this.ticketId}
          ticket_old_body = ticket.ticket_old_body


          @script_tickets2[:body] = ticket_old_body.description
          @script_tickets2[:body_html] = ticket_old_body.description_html


          ticket_old_body.description = description
          ticket_old_body.description_html = description_html
          ticket_old_body.save!
          end `;
      this.generatedCode = tktFixTemplate;
    }
  }
});
