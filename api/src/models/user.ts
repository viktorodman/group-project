import mongoose, { Document, Model, Schema} from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';
import Page from './page';

const { isEmail } = validator;

export interface IUser extends Document {
    email: string
    password: string
    pageIds: Array<string>
}

export interface IUserModel extends Model<IUser> {
    authenticate(email: string, password: string): Promise<IUser>,
    updatePageId(user: IUser, currentId: string, newId: string): Promise<void>
    deletePageId(user: IUser, currentId: string): Promise<void>
}

export const schema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [isEmail, '{VALUE} is not a valid email address.']
    },
    password: {
        type: String,
        minlength: [10, 'The password must be of minimum length 10 characters.'],
        required: true
    },
    pageIds: {
        type: Array,
    } 
}, {
    timestamps: true
});

schema.pre<IUser>('save', async function () {
    this.password = await bcrypt.hash(this.password, 10);
});

schema.statics.authenticate = async function(email: string, password: string): Promise<void> {
    const user = await this.findOne({ email });

    if(!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid email or password');
    }
};

schema.statics.updatePageId = async function(user: IUser, currentId: string, newId: string): Promise<void> {
    if(user) {
        const newIds = user.pageIds.map(id => {
            return id === currentId 
                ? newId 
                : id;
        });

        await User.updateOne({_id: user.id}, {pageIds: newIds});
    }
};

schema.statics.deletePageId = async function(user: IUser, currentId: string): Promise<void> {
    if(user) {

        const foundPage = await Page.findOne({_id: currentId});

        if(foundPage){
            const filteredIds = user.pageIds.filter(id => id !== foundPage.id);
            await User.updateOne({_id: user.id}, {pageIds: filteredIds});
        }
    }
};

const User: IUserModel = mongoose.model<IUser, IUserModel>('User', schema);

export default User;
